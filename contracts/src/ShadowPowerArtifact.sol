// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IShadowPowerArtifact.sol";

/**
 * @title ShadowPowerArtifact
 * @dev Artifact contract for enhancing shadow powers in Cursed Faction MMO
 * Implements ERC-721 with soulbinding and power enhancement mechanics
 */
contract ShadowPowerArtifact is ERC721, ERC721URIStorage, Ownable, IShadowPowerArtifact {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Constants
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_POWER_LEVEL = 10;
    
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
    
    // Artifact storage
    mapping(uint256 => ArtifactData) private _artifactData;
    mapping(uint256 => address) private _equippedBy; // Soulbound to avatar
    mapping(uint256 => bool) private _isSoulbound;
    
    // Power enhancement tracking
    mapping(uint256 => mapping(uint256 => uint256)) private _powerEnhancements; // artifactId => avatarId => enhancementLevel
    
    // Events
    event ArtifactMinted(uint256 indexed tokenId, address indexed owner, ArtifactType artifactType, Rarity rarity, uint8 powerLevel);
    event ArtifactEquipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event ArtifactUnequipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event PowerEnhanced(uint256 indexed artifactId, uint256 indexed avatarId, uint8 newPowerLevel);
    event SoulbindingActivated(uint256 indexed tokenId, uint256 indexed avatarId);
    
    // Structs
    struct ArtifactData {
        ArtifactType artifactType;    // Type of artifact
        Rarity rarity;                // Rarity tier
        uint8 powerLevel;             // Current power level (1-10)
        uint8 maxPowerLevel;          // Maximum possible power level
        bool soulbound;               // Whether artifact is soulbound
        uint256 mintTimestamp;        // When the artifact was minted
        uint256 lastEnhancement;      // Last time power was enhanced
    }
    
    // Modifiers
    modifier mintingAllowed() {
        require(mintingEnabled, "Minting not enabled");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }
    
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }
    
    modifier notSoulbound(uint256 tokenId) {
        require(!_isSoulbound[tokenId], "Artifact is soulbound");
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
     * @dev Mints a new shadow power artifact
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
    ) external mintingAllowed returns (uint256) {
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Invalid recipient");
        require(powerLevel > 0 && powerLevel <= maxPowerLevel, "Invalid power level");
        require(maxPowerLevel <= MAX_POWER_LEVEL, "Power level too high");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Create and store artifact data
        _artifactData[tokenId] = ArtifactData({
            artifactType: artifactType,
            rarity: rarity,
            powerLevel: powerLevel,
            maxPowerLevel: maxPowerLevel,
            soulbound: false,
            mintTimestamp: block.timestamp,
            lastEnhancement: block.timestamp
        });
        
        // Mint the token
        _safeMint(to, tokenId);
        
        emit ArtifactMinted(tokenId, to, artifactType, rarity, powerLevel);
        
        return tokenId;
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
    {
        require(avatarId > 0, "Invalid avatar ID");
        require(_equippedBy[tokenId] == address(0), "Artifact already equipped");
        
        // Activate soulbinding
        _equippedBy[tokenId] = msg.sender;
        _isSoulbound[tokenId] = true;
        
        // Initialize power enhancement
        _powerEnhancements[tokenId][avatarId] = _artifactData[tokenId].powerLevel;
        
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
    {
        require(_equippedBy[tokenId] == msg.sender, "Not equipped by you");
        require(_powerEnhancements[tokenId][avatarId] > 0, "Not equipped to this avatar");
        
        // Remove power enhancement
        delete _powerEnhancements[tokenId][avatarId];
        
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
        validTokenId(tokenId) 
        onlyTokenOwner(tokenId) 
    {
        require(_isSoulbound[tokenId], "Artifact must be soulbound");
        require(_equippedBy[tokenId] == msg.sender, "Not equipped by you");
        require(enhancementAmount > 0, "Invalid enhancement amount");
        
        ArtifactData storage artifact = _artifactData[tokenId];
        uint256 currentEnhancement = _powerEnhancements[tokenId][avatarId];
        uint256 newLevel = currentEnhancement + enhancementAmount;
        
        require(newLevel <= artifact.maxPowerLevel, "Exceeds maximum power level");
        
        _powerEnhancements[tokenId][avatarId] = newLevel;
        artifact.lastEnhancement = block.timestamp;
        
        emit PowerEnhanced(tokenId, avatarId, uint8(newLevel));
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
        for (uint256 i = 1; i <= 6666; i++) { // Max avatar supply
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
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
    }
    
    // Override functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Prevent transfer if soulbound
        if (_isSoulbound[tokenId]) {
            require(from == address(0) || to == address(0), "Soulbound artifact cannot be transferred");
        }
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up storage
        delete _artifactData[tokenId];
        delete _equippedBy[tokenId];
        delete _isSoulbound[tokenId];
        
        // Clean up power enhancements for all avatars
        for (uint256 i = 1; i <= 6666; i++) {
            delete _powerEnhancements[tokenId][i];
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
        return _baseURI;
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}