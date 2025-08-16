// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/ICursedGear1155.sol";

/**
 * @title CursedGear1155
 * @dev Gear and style NFT contract for Cursed Faction MMO
 * Implements ERC-1155 with evolution mechanics and style modifiers
 */
contract CursedGear1155 is ERC1155, Ownable, ICursedGear1155 {
    using Strings for uint256;
    using ECDSA for bytes32;

    // Constants
    uint256 public constant MAX_EVOLUTION_TIER = 5;
    uint256 public constant EVOLUTION_COST = 3; // Number of items needed to evolve
    
    // State variables
    string private _baseURI;
    bool public mintingEnabled = false;
    address public craftingStation;
    address public signerAddress;
    
    // Gear storage
    mapping(uint256 => GearData) private _gearData;
    mapping(uint256 => uint256) private _totalSupply;
    mapping(uint256 => mapping(address => uint256)) private _balances;
    
    // Evolution tracking
    mapping(uint256 => uint256) private _evolutionTiers;
    mapping(uint256 => uint256[]) private _evolutionHistory;
    
    // Events
    event GearMinted(uint256 indexed id, address indexed to, uint256 amount, GearType gearType, uint8 tier);
    event GearEvolved(uint256 indexed oldId, uint256 indexed newId, address indexed owner, uint8 newTier);
    event GearBurned(uint256 indexed id, address indexed from, uint256 amount);
    event CraftingStationSet(address indexed oldStation, address indexed newStation);
    event SignerAddressSet(address indexed oldSigner, address indexed newSigner);
    
    // Structs
    struct GearData {
        GearType gearType;      // Type of gear (weapon, armor, etc.)
        uint8 tier;             // Current tier (1-5)
        uint8 maxTier;          // Maximum possible tier
        string styleModifier;   // Style modifier identifier
        bool evolvable;         // Whether this gear can evolve
        uint256 mintTimestamp;  // When the gear was minted
    }
    
    enum GearType { 
        WEAPON_PISTOL, WEAPON_SMG, WEAPON_AR, WEAPON_BR, WEAPON_SHOTGUN, WEAPON_LMG, WEAPON_SNIPER,
        ARMOR_RELIQUARY, ARMOR_RUNIC, ARMOR_GRAFTED, ARMOR_WRAITHWEAVE,
        MELEE_BLADE, MELEE_HAMMER, MELEE_CHAIN,
        THROWABLE, SIGIL, COSMETIC
    }
    
    // Modifiers
    modifier mintingAllowed() {
        require(mintingEnabled, "Minting not enabled");
        _;
    }
    
    modifier onlyCraftingStation() {
        require(msg.sender == craftingStation, "Only crafting station");
        _;
    }
    
    modifier validGearId(uint256 id) {
        require(_gearData[id].gearType != GearType(0) || _gearData[id].gearType == GearType(0), "Invalid gear ID");
        _;
    }
    
    constructor(string memory baseURI) ERC1155(baseURI) {
        _baseURI = baseURI;
        signerAddress = msg.sender;
    }
    
    /**
     * @dev Mints new gear
     * @param to Address to mint to
     * @param id Gear ID
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
    ) external mintingAllowed returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(tier > 0 && tier <= maxTier, "Invalid tier");
        require(maxTier <= MAX_EVOLUTION_TIER, "Tier too high");
        
        // Initialize gear data if first time minting
        if (_gearData[id].gearType == GearType(0)) {
            _gearData[id] = GearData({
                gearType: gearType,
                tier: tier,
                maxTier: maxTier,
                styleModifier: styleModifier,
                evolvable: evolvable,
                mintTimestamp: block.timestamp
            });
        }
        
        // Update balances and supply
        _balances[id][to] += amount;
        _totalSupply[id] += amount;
        
        emit TransferSingle(msg.sender, address(0), to, id, amount);
        emit GearMinted(id, to, amount, gearType, tier);
        
        return true;
    }
    
    /**
     * @dev Evolves gear by combining multiple items
     * @param ids Array of gear IDs to evolve
     * @param amounts Array of amounts for each ID
     * @param signature Server signature authorizing evolution
     * @param newId New evolved gear ID
     * @param newTier New tier level
     */
    function evolve(
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory signature,
        uint256 newId,
        uint8 newTier
    ) external returns (uint256) {
        require(ids.length == amounts.length, "Array length mismatch");
        require(ids.length == EVOLUTION_COST, "Invalid evolution cost");
        require(newTier > 0 && newTier <= MAX_EVOLUTION_TIER, "Invalid new tier");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "EVOLVE",
            ids,
            amounts,
            newId,
            newTier,
            msg.sender
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == signerAddress, "Invalid signature");
        
        // Check if user has enough items and burn them
        for (uint256 i = 0; i < ids.length; i++) {
            require(_balances[ids[i]][msg.sender] >= amounts[i], "Insufficient balance");
            _balances[ids[i]][msg.sender] -= amounts[i];
            _totalSupply[ids[i]] -= amounts[i];
            
            // Track evolution history
            _evolutionHistory[newId].push(ids[i]);
        }
        
        // Mint evolved gear
        _balances[newId][msg.sender] += 1;
        _totalSupply[newId] += 1;
        
        // Set evolution tier
        _evolutionTiers[newId] = newTier;
        
        emit TransferSingle(msg.sender, address(0), msg.sender, newId, 1);
        emit GearEvolved(ids[0], newId, msg.sender, newTier);
        
        return newId;
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
    ) external onlyCraftingStation {
        require(from != address(0), "Invalid address");
        require(amount > 0, "Invalid amount");
        require(_balances[id][from] >= amount, "Insufficient balance");
        
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
            uint256 mintTimestamp
        ) 
    {
        GearData storage gear = _gearData[id];
        return (
            gear.gearType,
            gear.tier,
            gear.maxTier,
            gear.styleModifier,
            gear.evolvable,
            gear.mintTimestamp
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
     * @dev Returns total supply for a specific gear ID
     * @param id Gear ID
     * @return Total supply
     */
    function totalSupply(uint256 id) external view returns (uint256) {
        return _totalSupply[id];
    }
    
    // Admin functions
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
    }
    
    function setCraftingStation(address newStation) external onlyOwner {
        address oldStation = craftingStation;
        craftingStation = newStation;
        emit CraftingStationSet(oldStation, newStation);
    }
    
    function setSignerAddress(address newSigner) external onlyOwner {
        address oldSigner = signerAddress;
        signerAddress = newSigner;
        emit SignerAddressSet(oldSigner, newSigner);
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
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
        require(accounts.length == ids.length, "Array length mismatch");
        
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
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, id.toString()));
    }
}