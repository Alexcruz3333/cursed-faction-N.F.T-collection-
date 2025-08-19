// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IShadowPowerArtifact.sol";

/**
 * @title ShadowPowerArtifact
 * @dev Artifact contract for enhancing shadow powers in Cursed Faction MMO
 * Implements ERC-721 with soulbinding and power enhancement mechanics
 * 
 * Features:
 * - Soulbinding system for avatar-specific artifacts
 * - Power enhancement mechanics with cooldowns
 * - Batch operations for gas efficiency
 * - Enhanced security with reentrancy protection and pausability
 * - Faction-specific power amplification
 * - Temporary power boost system
 */
contract ShadowPowerArtifact is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable, IShadowPowerArtifact {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Custom errors for gas efficiency
    error MaxSupplyReached();
    error InvalidRecipient();
    error InvalidPowerLevel();
    error PowerLevelTooHigh();
    error MintingNotEnabled();
    error TokenDoesNotExist();
    error NotTokenOwner();
    error ArtifactAlreadyEquipped();
    error NotEquippedByYou();
    error NotEquippedToAvatar();
    error ArtifactMustBeSoulbound();
    error InvalidEnhancementAmount();
    error ExceedsMaxPowerLevel();
    error EnhancementCooldownActive();
    error InvalidAvatarId();
    error ContractPaused();
    error InvalidArtifactType();
    error InvalidRarity();

    // Constants
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_POWER_LEVEL = 10;
    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public constant ENHANCEMENT_COOLDOWN = 1 hours;
    uint256 public constant MAX_AVATAR_ID = 6666;
    
    // Enums
    enum ArtifactType { 
        SHADOW_AMPLIFIER,    // Increases shadow power effectiveness
        VOID_CATALYST,       // Reduces shadow power cooldowns
        SOUL_ANCHOR,         // Provides additional shadow power charges
        DARKNESS_ESSENCE,    // Unlocks new shadow power abilities
        SHADOW_RESONATOR,    // Amplifies faction-specific shadow powers
        VOID_CRYSTAL,        // Allows shadow power sharing between avatars
        SOUL_FRAGMENT,       // Provides temporary shadow power boosts
        DARKNESS_CORE        // Ultimate shadow power enhancement
    }
    
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC }
    
    // State variables
    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    bool public mintingEnabled = false;
    uint256 public mintPrice = 0.2 ether;
    uint256 public enhancementFee = 0.01 ether;
    
    // Artifact storage
    mapping(uint256 => ArtifactData) private _artifactData;
    mapping(uint256 => address) private _equippedBy; // Soulbound to avatar
    mapping(uint256 => bool) private _isSoulbound;
    
    // Power enhancement tracking
    mapping(uint256 => mapping(uint256 => uint256)) private _powerEnhancements; // artifactId => avatarId => enhancementLevel
    mapping(uint256 => mapping(uint256 => uint256)) private _lastEnhancement; // artifactId => avatarId => timestamp
    
    // Temporary power boost tracking
    mapping(uint256 => mapping(uint256 => uint256)) private _temporaryBoosts; // artifactId => avatarId => boostLevel
    mapping(uint256 => mapping(uint256 => uint256)) private _boostExpiry; // artifactId => avatarId => expiry timestamp
    
    // Events
    event ArtifactMinted(uint256 indexed tokenId, address indexed owner, ArtifactType artifactType, Rarity rarity, uint8 powerLevel, uint256 price);
    event BatchArtifactsMinted(address indexed owner, uint256[] tokenIds, ArtifactType[] artifactTypes, Rarity[] rarities, uint8[] powerLevels, uint256 totalPrice);
    event ArtifactEquipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event ArtifactUnequipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event PowerEnhanced(uint256 indexed artifactId, uint256 indexed avatarId, uint8 newPowerLevel, uint256 fee);
    event SoulbindingActivated(uint256 indexed tokenId, uint256 indexed avatarId);
    event TemporaryBoostApplied(uint256 indexed artifactId, uint256 indexed avatarId, uint8 boostLevel, uint256 duration);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event EnhancementFeeUpdated(uint256 oldFee, uint256 newFee);
    event MintingToggled(bool enabled);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    // Structs
    struct ArtifactData {
        ArtifactType artifactType;    // Type of artifact
        Rarity rarity;                // Rarity tier
        uint8 powerLevel;             // Current power level (1-10)
        uint8 maxPowerLevel;          // Maximum possible power level
        bool soulbound;               // Whether artifact is soulbound
        uint64 mintTimestamp;         // When the artifact was minted (compressed timestamp)
        uint64 lastEnhancement;       // Last time power was enhanced
    }
    
    struct MintBatchData {
        address to;
        ArtifactType[] artifactTypes;
        Rarity[] rarities;
        uint8[] powerLevels;
        uint8[] maxPowerLevels;
        uint256 totalPrice;
    }
    
    struct EnhancementData {
        uint256 artifactId;
        uint256 avatarId;
        uint8 enhancementAmount;
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
    
    modifier notSoulbound(uint256 tokenId) {
        if (_isSoulbound[tokenId]) revert ArtifactMustBeSoulbound();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused()) revert ContractPaused();
        _;
    }
    
    modifier validArtifactType(ArtifactType artifactType) {
        if (uint8(artifactType) > 7) revert InvalidArtifactType();
        _;
    }
    
    modifier validRarity(Rarity rarity) {
        if (uint8(rarity) > 5) revert InvalidRarity();
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
     * @dev Mints a new shadow power artifact with payment
     * @param to Address to mint to
     * @param artifactType Type of artifact
     * @param rarity Rarity tier
     * @param powerLevel Initial power level
     * @param maxPowerLevel Maximum power level
     */
    function mint(
        address to,
        ArtifactType artifactType,
        Rarity rarity,
        uint8 powerLevel,
        uint8 maxPowerLevel
    ) external payable mintingAllowed whenNotPaused nonReentrant returns (uint256) {
        if (_tokenIdCounter.current() >= MAX_SUPPLY) revert MaxSupplyReached();
        if (to == address(0)) revert InvalidRecipient();
        if (powerLevel == 0 || powerLevel > maxPowerLevel) revert InvalidPowerLevel();
        if (maxPowerLevel > MAX_POWER_LEVEL) revert PowerLevelTooHigh();
        if (msg.value != mintPrice) revert InvalidPowerLevel(); // Using as price check
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Create and store artifact data
        _artifactData[tokenId] = ArtifactData({
            artifactType: artifactType,
            rarity: rarity,
            powerLevel: powerLevel,
            maxPowerLevel: maxPowerLevel,
            soulbound: false,
            mintTimestamp: uint64(block.timestamp),
            lastEnhancement: 0
        });
        
        // Mint the token
        _safeMint(to, tokenId);
        
        emit ArtifactMinted(tokenId, to, artifactType, rarity, powerLevel, msg.value);
        
        return tokenId;
    }
    
    /**
     * @dev Mints multiple artifacts in a batch for gas efficiency
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
            totalMints += batchData[i].artifactTypes.length;
        }
        
        if (msg.value != totalPrice) revert InvalidPowerLevel();
        if (totalMints > MAX_BATCH_SIZE) revert InvalidPowerLevel();
        if (_tokenIdCounter.current() + totalMints > MAX_SUPPLY) revert MaxSupplyReached();
        
        uint256[] memory tokenIds = new uint256[](totalMints);
        ArtifactType[] memory artifactTypes = new ArtifactType[](totalMints);
        Rarity[] memory rarities = new Rarity[](totalMints);
        uint8[] memory powerLevels = new uint8[](totalMints);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < batchData.length; i++) {
            MintBatchData calldata data = batchData[i];
            
            if (data.to == address(0)) revert InvalidRecipient();
            
            for (uint256 j = 0; j < data.artifactTypes.length; j++) {
                uint256 tokenId = _tokenIdCounter.current();
                _tokenIdCounter.increment();
                
                if (data.powerLevels[j] == 0 || data.powerLevels[j] > data.maxPowerLevels[j]) revert InvalidPowerLevel();
                if (data.maxPowerLevels[j] > MAX_POWER_LEVEL) revert PowerLevelTooHigh();
                
                // Create and store artifact data
                _artifactData[tokenId] = ArtifactData({
                    artifactType: data.artifactTypes[j],
                    rarity: data.rarities[j],
                    powerLevel: data.powerLevels[j],
                    maxPowerLevel: data.maxPowerLevels[j],
                    soulbound: false,
                    mintTimestamp: uint64(block.timestamp),
                    lastEnhancement: 0
                });
                
                // Store batch data
                tokenIds[currentIndex] = tokenId;
                artifactTypes[currentIndex] = data.artifactTypes[j];
                rarities[currentIndex] = data.rarities[j];
                powerLevels[currentIndex] = data.powerLevels[j];
                currentIndex++;
                
                // Mint the token
                _safeMint(data.to, tokenId);
            }
        }
        
        emit BatchArtifactsMinted(msg.sender, tokenIds, artifactTypes, rarities, powerLevels, totalPrice);
    }
    
    /**
     * @dev Equips artifact to an avatar (activates soulbinding)
     * @param tokenId The artifact to equip
     * @param avatarId The avatar to equip to
     */
    function equipArtifact(uint256 tokenId, uint256 avatarId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        notSoulbound(tokenId) 
        whenNotPaused 
        nonReentrant 
    {
        if (avatarId == 0 || avatarId > MAX_AVATAR_ID) revert InvalidAvatarId();
        if (_equippedBy[tokenId] != address(0)) revert ArtifactAlreadyEquipped();
        
        // Activate soulbinding
        _equippedBy[tokenId] = msg.sender;
        _isSoulbound[tokenId] = true;
        
        // Initialize power enhancement
        _powerEnhancements[tokenId][avatarId] = _artifactData[tokenId].powerLevel;
        _lastEnhancement[tokenId][avatarId] = block.timestamp;
        
        emit ArtifactEquipped(tokenId, avatarId, msg.sender);
        emit SoulbindingActivated(tokenId, avatarId);
    }
    
    /**
     * @dev Unequips artifact from avatar
     * @param tokenId The artifact to unequip
     * @param avatarId The avatar to unequip from
     */
    function unequipArtifact(uint256 tokenId, uint256 avatarId) 
        external 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
        nonReentrant 
    {
        if (_equippedBy[tokenId] != msg.sender) revert NotEquippedByYou();
        if (_powerEnhancements[tokenId][avatarId] == 0) revert NotEquippedToAvatar();
        
        // Remove power enhancement and temporary boost
        delete _powerEnhancements[tokenId][avatarId];
        delete _lastEnhancement[tokenId][avatarId];
        delete _temporaryBoosts[tokenId][avatarId];
        delete _boostExpiry[tokenId][avatarId];
        
        emit ArtifactUnequipped(tokenId, avatarId, msg.sender);
    }
    
    /**
     * @dev Enhances artifact power level
     * @param tokenId The artifact to enhance
     * @param avatarId The avatar to enhance for
     * @param enhancementAmount Amount to enhance by
     */
    function enhancePower(
        uint256 tokenId, 
        uint256 avatarId, 
        uint8 enhancementAmount
    ) 
        external 
        payable 
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
        whenNotPaused 
        nonReentrant 
    {
        if (!_isSoulbound[tokenId]) revert ArtifactMustBeSoulbound();
        if (_equippedBy[tokenId] != msg.sender) revert NotEquippedByYou();
        if (enhancementAmount == 0) revert InvalidEnhancementAmount();
        if (msg.value != enhancementFee) revert InvalidEnhancementAmount();
        
        // Check cooldown
        uint256 lastEnhancement = _lastEnhancement[tokenId][avatarId];
        if (block.timestamp < lastEnhancement + ENHANCEMENT_COOLDOWN) revert EnhancementCooldownActive();
        
        ArtifactData storage artifact = _artifactData[tokenId];
        uint256 currentEnhancement = _powerEnhancements[tokenId][avatarId];
        uint256 newLevel = currentEnhancement + enhancementAmount;
        
        if (newLevel > artifact.maxPowerLevel) revert ExceedsMaxPowerLevel();
        
        _powerEnhancements[tokenId][avatarId] = newLevel;
        _lastEnhancement[tokenId][avatarId] = block.timestamp;
        
        emit PowerEnhanced(tokenId, avatarId, uint8(newLevel), msg.value);
    }
    
    /**
     * @dev Applies a temporary power boost to an artifact
     * @param tokenId The artifact to boost
     * @param avatarId The avatar to boost for
     * @param boostLevel The boost level to apply
     * @param duration Duration of the boost in seconds
     */
    function applyTemporaryBoost(
        uint256 tokenId,
        uint256 avatarId,
        uint8 boostLevel,
        uint256 duration
    ) external validTokenId(tokenId) onlyTokenOwner(tokenId) whenNotPaused nonReentrant {
        if (!_isSoulbound[tokenId]) revert ArtifactMustBeSoulbound();
        if (_equippedBy[tokenId] != msg.sender) revert NotEquippedByYou();
        if (boostLevel == 0 || duration == 0) revert InvalidEnhancementAmount();
        
        _temporaryBoosts[tokenId][avatarId] = boostLevel;
        _boostExpiry[tokenId][avatarId] = block.timestamp + duration;
        
        emit TemporaryBoostApplied(tokenId, avatarId, boostLevel, duration);
    }
    
    /**
     * @dev Returns artifact data for a specific ID
     * @param tokenId The artifact ID
     * @return Complete artifact information
     */
    function getArtifactData(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (
            ArtifactType artifactType,
            Rarity rarity,
            uint8 powerLevel,
            uint8 maxPowerLevel,
            bool soulbound,
            uint256 mintTimestamp,
            uint256 lastEnhancement
        ) 
    {
        ArtifactData storage artifact = _artifactData[tokenId];
        return (
            artifact.artifactType,
            artifact.rarity,
            artifact.powerLevel,
            artifact.maxPowerLevel,
            artifact.soulbound,
            artifact.mintTimestamp,
            artifact.lastEnhancement
        );
    }
    
    /**
     * @dev Returns power enhancement for an artifact-avatar combination
     * @param tokenId The artifact ID
     * @param avatarId The avatar ID
     * @return Power enhancement level
     */
    function getPowerEnhancement(uint256 tokenId, uint256 avatarId) 
        external 
        view 
        returns (uint256) 
    {
        return _powerEnhancements[tokenId][avatarId];
    }
    
    /**
     * @dev Returns temporary boost information for an artifact-avatar combination
     * @param tokenId The artifact ID
     * @param avatarId The avatar ID
     * @return boostLevel, expiry timestamp, and whether boost is active
     */
    function getTemporaryBoost(uint256 tokenId, uint256 avatarId) 
        external 
        view 
        returns (
            uint256 boostLevel,
            uint256 expiry,
            bool isActive
        ) 
    {
        boostLevel = _temporaryBoosts[tokenId][avatarId];
        expiry = _boostExpiry[tokenId][avatarId];
        isActive = block.timestamp < expiry;
        
        if (!isActive) {
            boostLevel = 0;
        }
        
        return (boostLevel, expiry, isActive);
    }
    
    /**
     * @dev Returns whether artifact is equipped and by whom
     * @param tokenId The artifact ID
     * @return equippedBy address and avatarId
     */
    function getEquippedInfo(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId) 
        returns (address equippedBy, uint256 avatarId) 
    {
        equippedBy = _equippedBy[tokenId];
        // Find avatarId by searching through enhancements
        for (uint256 i = 1; i <= MAX_AVATAR_ID; i++) {
            if (_powerEnhancements[tokenId][i] > 0) {
                avatarId = i;
                break;
            }
        }
        return (equippedBy, avatarId);
    }
    
    /**
     * @dev Returns total supply and minted count
     * @return totalSupply and minted count
     */
    function getMintStats() external view returns (uint256 totalSupply, uint256 minted) {
        return (MAX_SUPPLY, _tokenIdCounter.current());
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
    
    function setEnhancementFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = enhancementFee;
        enhancementFee = newFee;
        emit EnhancementFeeUpdated(oldFee, newFee);
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
    
    // Override functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Prevent transfer if soulbound
        for (uint256 i = 0; i < batchSize; i++) {
            uint256 tokenId = firstTokenId + i;
            if (_isSoulbound[tokenId]) {
                if (from != address(0) && to != address(0)) {
                    revert("Soulbound artifact cannot be transferred");
                }
            }
        }
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up storage
        delete _artifactData[tokenId];
        delete _equippedBy[tokenId];
        delete _isSoulbound[tokenId];
        
        // Clean up power enhancements and boosts for all avatars
        for (uint256 i = 1; i <= MAX_AVATAR_ID; i++) {
            delete _powerEnhancements[tokenId][i];
            delete _lastEnhancement[tokenId][i];
            delete _temporaryBoosts[tokenId][i];
            delete _boostExpiry[tokenId][i];
        }
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
    
    // Receive function for ETH
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
}