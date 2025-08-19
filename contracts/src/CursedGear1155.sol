// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/ICursedGear1155.sol";

/**
 * @title CursedGear1155
 * @dev Gear and style NFT contract for Cursed Faction MMO
 * Implements ERC-1155 with evolution mechanics and style modifiers
 * 
 * Features:
 * - Multi-tier gear system with evolution mechanics
 * - Style modifiers for customization
 * - Batch operations for gas efficiency
 * - Enhanced security with reentrancy protection and pausability
 * - Signature-based authorization for evolution
 * - Crafting station integration
 */
contract CursedGear1155 is ERC1155, Ownable, ReentrancyGuard, Pausable, ICursedGear1155 {
    using Strings for uint256;
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // Custom errors for gas efficiency
    error InvalidRecipient();
    error InvalidAmount();
    error InvalidTier();
    error InvalidGearType();
    error MintingNotEnabled();
    error InsufficientBalance();
    error ArrayLengthMismatch();
    error InvalidEvolutionCost();
    error InvalidSignature();
    error InvalidNewTier();
    error GearNotEvolvable();
    error EvolutionNotAllowed();
    error ContractPaused();
    error OnlyCraftingStation();
    error InvalidGearId();

    // Constants
    uint256 public constant MAX_EVOLUTION_TIER = 5;
    uint256 public constant EVOLUTION_COST = 3; // Number of items needed to evolve
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MAX_GEAR_PER_MINT = 50;
    
    // State variables
    string private _baseURI;
    bool public mintingEnabled = false;
    address public craftingStation;
    address public signerAddress;
    uint256 public mintPrice = 0.05 ether;
    uint256 public evolutionFee = 0.01 ether;
    
    // Gear storage
    mapping(uint256 => GearData) private _gearData;
    mapping(uint256 => uint256) private _totalSupply;
    mapping(uint256 => mapping(address => uint256)) private _balances;
    
    // Evolution tracking
    mapping(uint256 => uint256) private _evolutionTiers;
    mapping(uint256 => uint256[]) private _evolutionHistory;
    mapping(uint256 => bool) private _isEvolved;
    
    // Gear ID counter for auto-generation
    Counters.Counter private _gearIdCounter;
    
    // Events
    event GearMinted(uint256 indexed id, address indexed to, uint256 amount, GearType gearType, uint8 tier, uint256 price);
    event BatchGearMinted(address indexed to, uint256[] ids, uint256[] amounts, GearType[] gearTypes, uint8[] tiers, uint256 totalPrice);
    event GearEvolved(uint256 indexed oldId, uint256 indexed newId, address indexed owner, uint8 newTier, uint256 fee);
    event GearBurned(uint256 indexed id, address indexed from, uint256 amount);
    event CraftingStationSet(address indexed oldStation, address indexed newStation);
    event SignerAddressSet(address indexed oldSigner, address indexed newSigner);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event EvolutionFeeUpdated(uint256 oldFee, uint256 newFee);
    event MintingToggled(bool enabled);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    // Structs
    struct GearData {
        GearType gearType;      // Type of gear (weapon, armor, etc.)
        uint8 tier;             // Current tier (1-5)
        uint8 maxTier;          // Maximum possible tier
        string styleModifier;   // Style modifier identifier
        bool evolvable;         // Whether this gear can evolve
        uint64 mintTimestamp;   // When the gear was minted (compressed timestamp)
        uint64 lastEvolution;   // Last time gear was evolved
    }
    
    struct EvolutionData {
        uint256[] sourceIds;    // Source gear IDs
        uint256[] amounts;      // Amounts of each source gear
        uint256 newId;          // New evolved gear ID
        uint8 newTier;          // New tier level
        bytes signature;        // Server signature
    }
    
    enum GearType { 
        WEAPON_PISTOL, WEAPON_SMG, WEAPON_AR, WEAPON_BR, WEAPON_SHOTGUN, WEAPON_LMG, WEAPON_SNIPER,
        ARMOR_RELIQUARY, ARMOR_RUNIC, ARMOR_GRAFTED, ARMOR_WRAITHWEAVE,
        MELEE_BLADE, MELEE_HAMMER, MELEE_CHAIN,
        THROWABLE, SIGIL, COSMETIC
    }
    
    // Modifiers
    modifier mintingAllowed() {
        if (!mintingEnabled) revert MintingNotEnabled();
        _;
    }
    
    modifier onlyCraftingStation() {
        if (msg.sender != craftingStation) revert OnlyCraftingStation();
        _;
    }
    
    modifier validGearId(uint256 id) {
        if (_gearData[id].gearType == GearType(0) && id != 0) revert InvalidGearId();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused()) revert ContractPaused();
        _;
    }
    
    modifier validGearType(GearType gearType) {
        if (uint8(gearType) > 20) revert InvalidGearType();
        _;
    }
    
    constructor(string memory baseURI) ERC1155(baseURI) {
        _baseURI = baseURI;
        signerAddress = msg.sender;
    }
    
    /**
     * @dev Mints new gear with payment
     * @param to Address to mint to
     * @param id Gear ID (0 for auto-generated)
     * @param amount Amount to mint
     * @param gearType Type of gear
     * @param tier Tier level
     * @param maxTier Maximum tier
     * @param styleModifier Style modifier
     * @param evolvable Whether gear can evolve
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        GearType gearType,
        uint8 tier,
        uint8 maxTier,
        string memory styleModifier,
        bool evolvable
    ) external payable mintingAllowed whenNotPaused nonReentrant returns (uint256) {
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0 || amount > MAX_GEAR_PER_MINT) revert InvalidAmount();
        if (tier == 0 || tier > maxTier) revert InvalidTier();
        if (maxTier > MAX_EVOLUTION_TIER) revert InvalidTier();
        if (msg.value != mintPrice * amount) revert InvalidAmount();
        
        // Auto-generate gear ID if not provided
        if (id == 0) {
            id = _gearIdCounter.current();
            _gearIdCounter.increment();
        }
        
        // Initialize gear data if first time minting
        if (_gearData[id].gearType == GearType(0)) {
            _gearData[id] = GearData({
                gearType: gearType,
                tier: tier,
                maxTier: maxTier,
                styleModifier: styleModifier,
                evolvable: evolvable,
                mintTimestamp: uint64(block.timestamp),
                lastEvolution: 0
            });
        }
        
        // Update balances and supply
        _balances[id][to] += amount;
        _totalSupply[id] += amount;
        
        emit TransferSingle(msg.sender, address(0), to, id, amount);
        emit GearMinted(id, to, amount, gearType, tier, msg.value);
        
        return id;
    }
    
    /**
     * @dev Mints multiple gear items in a batch for gas efficiency
     * @param to Address to mint to
     * @param ids Array of gear IDs
     * @param amounts Array of amounts for each ID
     * @param gearTypes Array of gear types
     * @param tiers Array of tier levels
     * @param maxTiers Array of maximum tiers
     * @param styleModifiers Array of style modifiers
     * @param evolvables Array of evolvable flags
     */
    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        GearType[] calldata gearTypes,
        uint8[] calldata tiers,
        uint8[] calldata maxTiers,
        string[] calldata styleModifiers,
        bool[] calldata evolvables
    ) external payable mintingAllowed whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidRecipient();
        if (ids.length == 0 || ids.length > MAX_BATCH_SIZE) revert InvalidAmount();
        if (ids.length != amounts.length || ids.length != gearTypes.length || 
            ids.length != tiers.length || ids.length != maxTiers.length || 
            ids.length != styleModifiers.length || ids.length != evolvables.length) {
            revert ArrayLengthMismatch();
        }
        
        uint256 totalPrice = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0 || amounts[i] > MAX_GEAR_PER_MINT) revert InvalidAmount();
            if (tiers[i] == 0 || tiers[i] > maxTiers[i]) revert InvalidTier();
            if (maxTiers[i] > MAX_EVOLUTION_TIER) revert InvalidTier();
            totalPrice += mintPrice * amounts[i];
        }
        
        if (msg.value != totalPrice) revert InvalidAmount();
        
        uint256[] memory tokenIds = new uint256[](ids.length);
        GearType[] memory mintedGearTypes = new GearType[](ids.length);
        uint8[] memory mintedTiers = new uint8[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            
            // Auto-generate gear ID if not provided
            if (id == 0) {
                id = _gearIdCounter.current();
                _gearIdCounter.increment();
            }
            
            // Initialize gear data if first time minting
            if (_gearData[id].gearType == GearType(0)) {
                _gearData[id] = GearData({
                    gearType: gearTypes[i],
                    tier: tiers[i],
                    maxTier: maxTiers[i],
                    styleModifier: styleModifiers[i],
                    evolvable: evolvables[i],
                    mintTimestamp: uint64(block.timestamp),
                    lastEvolution: 0
                });
            }
            
            // Update balances and supply
            _balances[id][to] += amounts[i];
            _totalSupply[id] += amounts[i];
            
            tokenIds[i] = id;
            mintedGearTypes[i] = gearTypes[i];
            mintedTiers[i] = tiers[i];
        }
        
        emit TransferBatch(msg.sender, address(0), to, tokenIds, amounts);
        emit BatchGearMinted(to, tokenIds, amounts, mintedGearTypes, mintedTiers, totalPrice);
    }
    
    /**
     * @dev Evolves gear by combining multiple items
     * @param evolutionData Evolution configuration data
     */
    function evolve(EvolutionData calldata evolutionData) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        if (evolutionData.sourceIds.length != evolutionData.amounts.length) revert ArrayLengthMismatch();
        if (evolutionData.sourceIds.length != EVOLUTION_COST) revert InvalidEvolutionCost();
        if (evolutionData.newTier == 0 || evolutionData.newTier > MAX_EVOLUTION_TIER) revert InvalidNewTier();
        if (msg.value != evolutionFee) revert InvalidAmount();
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "EVOLVE",
            evolutionData.sourceIds,
            evolutionData.amounts,
            evolutionData.newId,
            evolutionData.newTier,
            msg.sender,
            block.chainid
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(evolutionData.signature);
        if (signer != signerAddress) revert InvalidSignature();
        
        // Check if user has enough items and burn them
        for (uint256 i = 0; i < evolutionData.sourceIds.length; i++) {
            uint256 sourceId = evolutionData.sourceIds[i];
            uint256 amount = evolutionData.amounts[i];
            
            if (_balances[sourceId][msg.sender] < amount) revert InsufficientBalance();
            if (!_gearData[sourceId].evolvable) revert GearNotEvolvable();
            
            _balances[sourceId][msg.sender] -= amount;
            _totalSupply[sourceId] -= amount;
            
            // Track evolution history
            _evolutionHistory[evolutionData.newId].push(sourceId);
        }
        
        // Mint evolved gear
        _balances[evolutionData.newId][msg.sender] += 1;
        _totalSupply[evolutionData.newId] += 1;
        
        // Set evolution tier and mark as evolved
        _evolutionTiers[evolutionData.newId] = evolutionData.newTier;
        _isEvolved[evolutionData.newId] = true;
        
        // Update last evolution timestamp
        if (_gearData[evolutionData.newId].gearType != GearType(0)) {
            _gearData[evolutionData.newId].lastEvolution = uint64(block.timestamp);
        }
        
        emit TransferSingle(msg.sender, address(0), msg.sender, evolutionData.newId, 1);
        emit GearEvolved(evolutionData.sourceIds[0], evolutionData.newId, msg.sender, evolutionData.newTier, msg.value);
        
        return evolutionData.newId;
    }
    
    /**
     * @dev Burns gear (only by crafting station)
     * @param from Address to burn from
     * @param id Gear ID
     * @param amount Amount to burn
     */
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyCraftingStation whenNotPaused {
        if (from == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (_balances[id][from] < amount) revert InsufficientBalance();
        
        _balances[id][from] -= amount;
        _totalSupply[id] -= amount;
        
        emit TransferSingle(msg.sender, from, address(0), id, amount);
        emit GearBurned(id, from, amount);
    }
    
    /**
     * @dev Returns gear data for a specific ID
     * @param id Gear ID
     * @return Complete gear information
     */
    function getGearData(uint256 id) 
        external 
        view 
        returns (
            GearType gearType,
            uint8 tier,
            uint8 maxTier,
            string memory styleModifier,
            bool evolvable,
            uint256 mintTimestamp,
            uint256 lastEvolution
        ) 
    {
        GearData storage gear = _gearData[id];
        return (
            gear.gearType,
            gear.tier,
            gear.maxTier,
            gear.styleModifier,
            gear.evolvable,
            gear.mintTimestamp,
            gear.lastEvolution
        );
    }
    
    /**
     * @dev Returns evolution tier for gear
     * @param id Gear ID
     * @return Evolution tier
     */
    function getEvolutionTier(uint256 id) external view returns (uint256) {
        return _evolutionTiers[id];
    }
    
    /**
     * @dev Returns evolution history for gear
     * @param id Gear ID
     * @return Array of source gear IDs used in evolution
     */
    function getEvolutionHistory(uint256 id) external view returns (uint256[] memory) {
        return _evolutionHistory[id];
    }
    
    /**
     * @dev Returns whether gear has been evolved
     * @param id Gear ID
     * @return True if gear has been evolved
     */
    function isEvolved(uint256 id) external view returns (bool) {
        return _isEvolved[id];
    }
    
    /**
     * @dev Returns total supply for a specific gear ID
     * @param id Gear ID
     * @return Total supply
     */
    function totalSupply(uint256 id) external view returns (uint256) {
        return _totalSupply[id];
    }
    
    /**
     * @dev Returns next available gear ID for auto-generation
     * @return Next gear ID
     */
    function getNextGearId() external view returns (uint256) {
        return _gearIdCounter.current();
    }
    
    // Admin functions
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingToggled(enabled);
    }
    
    function setCraftingStation(address newStation) external onlyOwner {
        if (newStation == address(0)) revert InvalidRecipient();
        address oldStation = craftingStation;
        craftingStation = newStation;
        emit CraftingStationSet(oldStation, newStation);
    }
    
    function setSignerAddress(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidRecipient();
        address oldSigner = signerAddress;
        signerAddress = newSigner;
        emit SignerAddressSet(oldSigner, newSigner);
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }
    
    function setEvolutionFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = evolutionFee;
        evolutionFee = newFee;
        emit EvolutionFeeUpdated(oldFee, newFee);
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
    }
    
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Override functions for ERC-1155
    function balanceOf(address account, uint256 id) 
        public 
        view 
        override 
        returns (uint256) 
    {
        return _balances[id][account];
    }
    
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
        public
        view
        override
        returns (uint256[] memory)
    {
        if (accounts.length != ids.length) revert ArrayLengthMismatch();
        
        uint256[] memory batchBalances = new uint256[](accounts.length);
        
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        
        return batchBalances;
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, id.toString()));
    }
    
    // Pausable override
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
    
    // Receive function for ETH
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
}