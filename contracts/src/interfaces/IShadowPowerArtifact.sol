// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IShadowPowerArtifact
 * @dev Interface for Shadow Power Artifact contract
 */
interface IShadowPowerArtifact {
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
    
    // Events
    event ArtifactMinted(uint256 indexed tokenId, address indexed owner, ArtifactType artifactType, Rarity rarity, uint8 powerLevel);
    event ArtifactEquipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event ArtifactUnequipped(uint256 indexed tokenId, uint256 indexed avatarId, address indexed owner);
    event PowerEnhanced(uint256 indexed artifactId, uint256 indexed avatarId, uint8 newPowerLevel);
    event SoulbindingActivated(uint256 indexed tokenId, uint256 indexed avatarId);
    
    // Core functions
    function mint(
        address to,
        ArtifactType artifactType,
        Rarity rarity,
        uint8 powerLevel,
        uint8 maxPowerLevel
    ) external returns (uint256);
    
    function equipArtifact(uint256 tokenId, uint256 avatarId) external;
    function unequipArtifact(uint256 tokenId, uint256 avatarId) external;
    function enhancePower(uint256 tokenId, uint256 avatarId, uint8 enhancementAmount) external;
    
    // View functions
    function getArtifactData(uint256 tokenId) external view returns (
        ArtifactType artifactType,
        Rarity rarity,
        uint8 powerLevel,
        uint8 maxPowerLevel,
        bool soulbound,
        uint256 mintTimestamp,
        uint256 lastEnhancement
    );
    
    function getPowerEnhancement(uint256 tokenId, uint256 avatarId) external view returns (uint256);
    function getEquippedInfo(uint256 tokenId) external view returns (address equippedBy, uint256 avatarId);
    function getMintStats() external view returns (uint256 totalSupply, uint256 minted);
    
    // Admin functions
    function setMintingEnabled(bool enabled) external;
    function setBaseURI(string memory newBaseURI) external;
    
    // Constants
    function MAX_SUPPLY() external view returns (uint256);
    function MAX_POWER_LEVEL() external view returns (uint256);
    function mintingEnabled() external view returns (bool);
}