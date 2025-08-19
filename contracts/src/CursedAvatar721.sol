// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ICursedAvatar721.sol";

/**
 * @title CursedAvatar721
 * @dev Core avatar NFT contract for Cursed Faction MMO
 * Implements ERC-721 with trait system, faction integration, and loadout binding
 * 
 * Features:
 * - Deterministic trait generation with seed-based randomness
 * - Faction-based shadow power assignment
 * - Loadout binding system
 * - Shadow power charge management with recharge mechanics
 * - Batch operations for gas efficiency
 * - Enhanced security with reentrancy protection and pausability
 */
contract CursedAvatar721 is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable, ICursedAvatar721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Custom errors for gas efficiency
    error MaxSupplyReached();
    error InvalidRecipient();
    error MintingNotEnabled();
    error TokenDoesNotExist();
    error NotTokenOwner();
    error LoadoutAlreadyBound();
    error NoLoadoutBound();
    error InvalidLoadoutAddress();
    error TraitsAlreadyRevealed();
    error NoShadowPowerCharges();
    error InvalidFaction();
    error InvalidRarity();
    error InvalidShadowPower();
    error ContractPaused();

    // Constants
    uint256 public constant MAX_SUPPLY = 6666;
    uint256 public constant MAX_TRAITS = 8;
    uint256 public constant MAX_BATCH_SIZE = 50;
    
    // Enums
    enum Faction { 
        GRAVEMIND_SYNDICATE, 
        HEX_ASSEMBLY, 
        CHROME_COVENANT, 
        WRAITH_COURT 
    }
    
    enum Rarity { 
        COMMON, 
        UNCOMMON, 
        RARE, 
        EPIC, 
        LEGENDARY, 
        MYTHIC 
    }
    
    enum ShadowPower { 
        NONE, 
        SHADOW_STEP, 
        VOID_BLAST, 
        DARKNESS_VEIL, 
        SOUL_HARVEST, 
        ABYSSAL_PULL, 
        SHADOW_MIRROR, 
        VOID_WALKER, 
        SHADOW_LORD 
    }
    
    // State variables
    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    bool public mintingEnabled = false;
    uint256 public mintPrice = 0.1 ether;
    uint256 public maxMintPerWallet = 5;
    
    // Trait storage - packed for gas efficiency
    mapping(uint256 => AvatarTraits) private _avatarTraits;
    mapping(uint256 => address) private _boundLoadouts;
    
    // Shadow power storage
    mapping(uint256 => ShadowPower) private _shadowPowers;
    mapping(uint256 => uint256) private _shadowPowerCharges;
    mapping(uint256 => uint256) private _lastShadowPowerRecharge;
    
    // Faction and rarity distributions
    mapping(Faction => uint256) public factionMintCounts;
    mapping(Rarity => uint256) public rarityMintCounts;
    mapping(ShadowPower => uint256) public shadowPowerCounts;
    
    // Mint tracking per wallet
    mapping(address => uint256) private _walletMintCounts;
    
    // Events
    event AvatarMinted(uint256 indexed tokenId, address indexed owner, Faction faction, Rarity rarity, uint256 price);
    event BatchAvatarsMinted(address indexed owner, uint256[] tokenIds, Faction[] factions, Rarity[] rarities, uint256 totalPrice);
    event LoadoutBound(uint256 indexed tokenId, address indexed loadoutAddress);
    event LoadoutUnbound(uint256 indexed tokenId);
    event TraitsRevealed(uint256 indexed tokenId, bytes32 seed);
    event ShadowPowerAssigned(uint256 indexed tokenId, ShadowPower power, uint256 charges);
    event ShadowPowerUsed(uint256 indexed tokenId, ShadowPower power, uint256 remainingCharges);
    event ShadowPowerRecharged(uint256 indexed tokenId, ShadowPower power, uint256 newCharges);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MaxMintPerWalletUpdated(uint256 oldLimit, uint256 newLimit);
    event MintingToggled(bool enabled);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    // Structs - optimized for gas efficiency
    struct AvatarTraits {
        bytes32 seed;           // Deterministic trait seed
        Faction faction;        // Faction assignment
        Rarity rarity;          // Rarity tier
        uint8[] traitValues;    // Individual trait values (0-255)
        bool revealed;          // Whether traits have been revealed
        uint64 mintTimestamp;   // When the avatar was minted (compressed timestamp)
    }
    
    struct ShadowPowerData {
        ShadowPower power;      // Type of shadow power
        uint256 maxCharges;     // Maximum charges for this power
        uint256 rechargeRate;   // Charges per day (in seconds)
        bool unlocked;          // Whether power is unlocked
    }
    
    struct MintBatchData {
        address to;
        Faction[] factions;
        bytes32[] seeds;
        uint256 totalPrice;
    }
    
    // Modifiers
    modifier mintingAllowed() {
        if (!mintingEnabled) revert MintingNotEnabled();
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        _;
    }
    
    modifier onlyTokenOwner(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused()) revert ContractPaused();
        _;
    }
    
    modifier validFaction(Faction faction) {
        if (uint8(faction) > 3) revert InvalidFaction();
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mints a new cursed avatar with payment
     * @param to Address to mint to
     * @param faction Faction assignment
     * @param seed Trait seed for deterministic generation
     */
    function mint(
        address to,
        Faction faction,
        bytes32 seed
    ) external payable mintingAllowed whenNotPaused nonReentrant returns (uint256) {
        if (_tokenIdCounter.current() >= MAX_SUPPLY) revert MaxSupplyReached();
        if (to == address(0)) revert InvalidRecipient();
        if (msg.value != mintPrice) revert InvalidRecipient(); // Using as price check
        if (_walletMintCounts[to] >= maxMintPerWallet) revert InvalidRecipient();
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Generate rarity and shadow power
        Rarity rarity = _generateRarity(seed);
        ShadowPower shadowPower = _generateShadowPower(seed, rarity);
        uint256 maxCharges = _getShadowPowerCharges(shadowPower);
        
        // Create and store traits
        _avatarTraits[tokenId] = AvatarTraits({
            seed: seed,
            faction: faction,
            rarity: rarity,
            traitValues: new uint8[](MAX_TRAITS),
            revealed: false,
            mintTimestamp: uint64(block.timestamp)
        });
        
        // Assign shadow power
        _shadowPowers[tokenId] = shadowPower;
        _shadowPowerCharges[tokenId] = maxCharges;
        _lastShadowPowerRecharge[tokenId] = block.timestamp;
        
        // Update counters
        factionMintCounts[faction]++;
        rarityMintCounts[rarity]++;
        shadowPowerCounts[shadowPower]++;
        _walletMintCounts[to]++;
        
        // Mint the token
        _safeMint(to, tokenId);
        
        emit AvatarMinted(tokenId, to, faction, rarity, msg.value);
        emit ShadowPowerAssigned(tokenId, shadowPower, maxCharges);
        
        return tokenId;
    }
    
    /**
     * @dev Mints multiple avatars in a batch for gas efficiency
     * @param batchData Array of mint data
     */
    function mintBatch(MintBatchData[] calldata batchData) 
        external 
        payable 
        mintingAllowed 
        whenNotPaused 
        nonReentrant 
    {
        uint256 totalPrice = 0;
        uint256 totalMints = 0;
        
        // Calculate total price and validate
        for (uint256 i = 0; i < batchData.length; i++) {
            totalPrice += batchData[i].totalPrice;
            totalMints += batchData[i].factions.length;
        }
        
        if (msg.value != totalPrice) revert InvalidRecipient();
        if (totalMints > MAX_BATCH_SIZE) revert InvalidRecipient();
        if (_tokenIdCounter.current() + totalMints > MAX_SUPPLY) revert MaxSupplyReached();
        
        uint256[] memory tokenIds = new uint256[](totalMints);
        Faction[] memory factions = new Faction[](totalMints);
        Rarity[] memory rarities = new Rarity[](totalMints);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < batchData.length; i++) {
            MintBatchData calldata data = batchData[i];
            
            if (data.to == address(0)) revert InvalidRecipient();
            if (_walletMintCounts[data.to] + data.factions.length > maxMintPerWallet) revert InvalidRecipient();
            
            for (uint256 j = 0; j < data.factions.length; j++) {
                uint256 tokenId = _tokenIdCounter.current();
                _tokenIdCounter.increment();
                
                // Generate rarity and shadow power
                Rarity rarity = _generateRarity(data.seeds[j]);
                ShadowPower shadowPower = _generateShadowPower(data.seeds[j], rarity);
                uint256 maxCharges = _getShadowPowerCharges(shadowPower);
                
                // Create and store traits
                _avatarTraits[tokenId] = AvatarTraits({
                    seed: data.seeds[j],
                    faction: data.factions[j],
                    rarity: rarity,
                    traitValues: new uint8[](MAX_TRAITS),
                    revealed: false,
                    mintTimestamp: uint64(block.timestamp)
                });
                
                // Assign shadow power
                _shadowPowers[tokenId] = shadowPower;
                _shadowPowerCharges[tokenId] = maxCharges;
                _lastShadowPowerRecharge[tokenId] = block.timestamp;
                
                // Update counters
                factionMintCounts[data.factions[j]]++;
                rarityMintCounts[rarity]++;
                shadowPowerCounts[shadowPower]++;
                
                // Store batch data
                tokenIds[currentIndex] = tokenId;
                factions[currentIndex] = data.factions[j];
                rarities[currentIndex] = rarity;
                currentIndex++;
                
                // Mint the token
                _safeMint(data.to, tokenId);
                
                emit ShadowPowerAssigned(tokenId, shadowPower, maxCharges);
            }
            
            _walletMintCounts[data.to] += data.factions.length;
        }
        
        emit BatchAvatarsMinted(msg.sender, tokenIds, factions, rarities, totalPrice);
    }
    
    /**
     * @dev Reveals traits for a specific avatar
     * @param tokenId The avatar to reveal
     */
    function revealTraits(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
        whenNotPaused 
        nonReentrant 
    {
        AvatarTraits storage traits = _avatarTraits[tokenId];
        if (traits.revealed) revert TraitsAlreadyRevealed();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        
        // Generate deterministic trait values from seed
        traits.traitValues = _generateTraitValues(traits.seed, tokenId);
        traits.revealed = true;
        
        emit TraitsRevealed(tokenId, traits.seed);
    }
    
    /**
     * @dev Binds a loadout account to this avatar
     * @param tokenId The avatar to bind
     * @param loadoutAddress The loadout contract address
     */
    function bindLoadout(uint256 tokenId, address loadoutAddress) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
    {
        if (loadoutAddress == address(0)) revert InvalidLoadoutAddress();
        if (_boundLoadouts[tokenId] != address(0)) revert LoadoutAlreadyBound();
        
        _boundLoadouts[tokenId] = loadoutAddress;
        
        emit LoadoutBound(tokenId, loadoutAddress);
    }
    
    /**
     * @dev Unbinds the loadout from this avatar
     * @param tokenId The avatar to unbind
     */
    function unbindLoadout(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
    {
        if (_boundLoadouts[tokenId] == address(0)) revert NoLoadoutBound();
        
        address loadoutAddress = _boundLoadouts[tokenId];
        delete _boundLoadouts[tokenId];
        
        emit LoadoutUnbound(tokenId);
    }
    
    /**
     * @dev Returns the complete traits for an avatar
     * @param tokenId The avatar ID
     * @return Complete trait information
     */
    function traits(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (
            bytes32 seed,
            uint8 faction,
            uint8 rarity,
            uint8[] memory traitValues,
            bool revealed,
            uint256 mintTimestamp
        ) 
    {
        AvatarTraits storage avatarTraits = _avatarTraits[tokenId];
        return (
            avatarTraits.seed,
            uint8(avatarTraits.faction),
            uint8(avatarTraits.rarity),
            avatarTraits.traitValues,
            avatarTraits.revealed,
            avatarTraits.mintTimestamp
        );
    }
    
    /**
     * @dev Returns the bound loadout address for an avatar
     * @param tokenId The avatar ID
     * @return The loadout contract address
     */
    function getBoundLoadout(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (address) 
    {
        return _boundLoadouts[tokenId];
    }
    
    /**
     * @dev Returns faction and rarity for an avatar
     * @param tokenId The avatar ID
     * @return faction and rarity
     */
    function getFactionAndRarity(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (Faction faction, Rarity rarity) 
    {
        AvatarTraits storage avatarTraits = _avatarTraits[tokenId];
        return (avatarTraits.faction, avatarTraits.rarity);
    }
    
    /**
     * @dev Returns shadow power information for an avatar
     * @param tokenId The avatar ID
     * @return power, current charges, max charges, and recharge info
     */
    function getShadowPower(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (
            ShadowPower power,
            uint256 currentCharges,
            uint256 maxCharges,
            uint256 lastRecharge,
            bool needsRecharge
        ) 
    {
        power = _shadowPowers[tokenId];
        currentCharges = _shadowPowerCharges[tokenId];
        maxCharges = _getShadowPowerCharges(power);
        lastRecharge = _lastShadowPowerRecharge[tokenId];
        
        // Check if recharge is needed
        uint256 timeSinceRecharge = block.timestamp - lastRecharge;
        uint256 rechargeRate = _getShadowPowerRechargeRate(power);
        needsRecharge = timeSinceRecharge >= rechargeRate && currentCharges < maxCharges;
        
        return (power, currentCharges, maxCharges, lastRecharge, needsRecharge);
    }
    
    /**
     * @dev Uses a shadow power charge
     * @param tokenId The avatar ID
     * @return remaining charges
     */
    function useShadowPower(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        if (_shadowPowerCharges[tokenId] == 0) revert NoShadowPowerCharges();
        
        _shadowPowerCharges[tokenId]--;
        
        emit ShadowPowerUsed(tokenId, _shadowPowers[tokenId], _shadowPowerCharges[tokenId]);
        
        return _shadowPowerCharges[tokenId];
    }
    
    /**
     * @dev Recharges shadow power charges
     * @param tokenId The avatar ID
     * @return new charge count
     */
    function rechargeShadowPower(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        ShadowPower power = _shadowPowers[tokenId];
        uint256 maxCharges = _getShadowPowerCharges(power);
        uint256 rechargeRate = _getShadowPowerRechargeRate(power);
        
        uint256 timeSinceRecharge = block.timestamp - _lastShadowPowerRecharge[tokenId];
        uint256 chargesToAdd = (timeSinceRecharge / rechargeRate) * 1;
        
        if (chargesToAdd > 0) {
            uint256 newCharges = _shadowPowerCharges[tokenId] + chargesToAdd;
            if (newCharges > maxCharges) {
                newCharges = maxCharges;
            }
            
            _shadowPowerCharges[tokenId] = newCharges;
            _lastShadowPowerRecharge[tokenId] = block.timestamp;
            
            emit ShadowPowerRecharged(tokenId, power, newCharges);
        }
        
        return _shadowPowerCharges[tokenId];
    }
    
    /**
     * @dev Returns total supply and minted count
     * @return totalSupply and minted count
     */
    function getMintStats() external view returns (uint256 totalSupply, uint256 minted) {
        return (MAX_SUPPLY, _tokenIdCounter.current());
    }
    
    /**
     * @dev Returns mint count for a specific wallet
     * @param wallet The wallet address
     * @return Number of avatars minted by the wallet
     */
    function getWalletMintCount(address wallet) external view returns (uint256) {
        return _walletMintCounts[wallet];
    }
    
    // Admin functions
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingToggled(enabled);
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }
    
    function setMaxMintPerWallet(uint256 newLimit) external onlyOwner {
        uint256 oldLimit = maxMintPerWallet;
        maxMintPerWallet = newLimit;
        emit MaxMintPerWalletUpdated(oldLimit, newLimit);
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
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
    
    // Internal functions
    function _generateRarity(bytes32 seed) internal pure returns (Rarity) {
        uint256 rarityRoll = uint256(keccak256(abi.encodePacked(seed))) % 1000;
        
        if (rarityRoll < 5) return Rarity.MYTHIC;      // 0.5%
        if (rarityRoll < 25) return Rarity.LEGENDARY;  // 2.0%
        if (rarityRoll < 75) return Rarity.EPIC;       // 5.0%
        if (rarityRoll < 200) return Rarity.RARE;      // 12.5%
        if (rarityRoll < 500) return Rarity.UNCOMMON;  // 30.0%
        return Rarity.COMMON;                           // 50.0%
    }
    
    function _generateTraitValues(bytes32 seed, uint256 tokenId) 
        internal 
        pure 
        returns (uint8[] memory) 
    {
        uint8[] memory values = new uint8[](MAX_TRAITS);
        
        for (uint8 i = 0; i < MAX_TRAITS; i++) {
            bytes32 traitSeed = keccak256(abi.encodePacked(seed, tokenId, i));
            values[i] = uint8(uint256(traitSeed) % 256);
        }
        
        return values;
    }
    
    function _generateShadowPower(bytes32 seed, Rarity rarity) internal pure returns (ShadowPower) {
        uint256 powerRoll = uint256(keccak256(abi.encodePacked(seed, "SHADOW_POWER"))) % 1000;
        
        // Rarity affects shadow power distribution
        if (rarity == Rarity.MYTHIC) {
            if (powerRoll < 100) return ShadowPower.SHADOW_LORD;        // 10%
            if (powerRoll < 300) return ShadowPower.VOID_WALKER;        // 20%
            if (powerRoll < 600) return ShadowPower.SHADOW_MIRROR;      // 30%
            return ShadowPower.ABYSSAL_PULL;                             // 40%
        } else if (rarity == Rarity.LEGENDARY) {
            if (powerRoll < 150) return ShadowPower.VOID_WALKER;        // 15%
            if (powerRoll < 400) return ShadowPower.SHADOW_MIRROR;      // 25%
            if (powerRoll < 700) return ShadowPower.ABYSSAL_PULL;       // 30%
            return ShadowPower.SOUL_HARVEST;                             // 30%
        } else if (rarity == Rarity.EPIC) {
            if (powerRoll < 200) return ShadowPower.SHADOW_MIRROR;      // 20%
            if (powerRoll < 500) return ShadowPower.ABYSSAL_PULL;       // 30%
            if (powerRoll < 800) return ShadowPower.SOUL_HARVEST;       // 30%
            return ShadowPower.DARKNESS_VEIL;                            // 20%
        } else if (rarity == Rarity.RARE) {
            if (powerRoll < 300) return ShadowPower.ABYSSAL_PULL;       // 30%
            if (powerRoll < 600) return ShadowPower.SOUL_HARVEST;       // 30%
            if (powerRoll < 900) return ShadowPower.DARKNESS_VEIL;      // 30%
            return ShadowPower.VOID_BLAST;                               // 10%
        } else if (rarity == Rarity.UNCOMMON) {
            if (powerRoll < 400) return ShadowPower.SOUL_HARVEST;       // 40%
            if (powerRoll < 700) return ShadowPower.DARKNESS_VEIL;      // 30%
            if (powerRoll < 900) return ShadowPower.VOID_BLAST;         // 20%
            return ShadowPower.SHADOW_STEP;                              // 10%
        } else {
            // COMMON
            if (powerRoll < 500) return ShadowPower.DARKNESS_VEIL;      // 50%
            if (powerRoll < 800) return ShadowPower.VOID_BLAST;         // 30%
            if (powerRoll < 950) return ShadowPower.SHADOW_STEP;        // 15%
            return ShadowPower.NONE;                                     // 5%
        }
    }
    
    function _getShadowPowerCharges(ShadowPower power) internal pure returns (uint256) {
        if (power == ShadowPower.SHADOW_LORD) return 5;
        if (power == ShadowPower.VOID_WALKER) return 4;
        if (power == ShadowPower.SHADOW_MIRROR) return 4;
        if (power == ShadowPower.ABYSSAL_PULL) return 3;
        if (power == ShadowPower.SOUL_HARVEST) return 3;
        if (power == ShadowPower.DARKNESS_VEIL) return 2;
        if (power == ShadowPower.VOID_BLAST) return 2;
        if (power == ShadowPower.SHADOW_STEP) return 1;
        return 0;
    }
    
    function _getShadowPowerRechargeRate(ShadowPower power) internal pure returns (uint256) {
        if (power == ShadowPower.SHADOW_LORD) return 1 days;      // 1 charge per day
        if (power == ShadowPower.VOID_WALKER) return 12 hours;    // 2 charges per day
        if (power == ShadowPower.SHADOW_MIRROR) return 12 hours;  // 2 charges per day
        if (power == ShadowPower.ABYSSAL_PULL) return 8 hours;    // 3 charges per day
        if (power == ShadowPower.SOUL_HARVEST) return 8 hours;    // 3 charges per day
        if (power == ShadowPower.DARKNESS_VEIL) return 6 hours;   // 4 charges per day
        if (power == ShadowPower.VOID_BLAST) return 6 hours;      // 4 charges per day
        if (power == ShadowPower.SHADOW_STEP) return 4 hours;     // 6 charges per day
        return 1 days; // Default
    }
    
    // Override functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up storage
        delete _avatarTraits[tokenId];
        delete _boundLoadouts[tokenId];
        delete _shadowPowers[tokenId];
        delete _shadowPowerCharges[tokenId];
        delete _lastShadowPowerRecharge[tokenId];
    }
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
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