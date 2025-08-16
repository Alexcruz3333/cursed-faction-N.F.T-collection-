// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICursedAvatar721
 * @dev Interface for Cursed Avatar NFT contract
 */
interface ICursedAvatar721 {
    // Enums
    enum Faction { GRAVEMIND_SYNDICATE, HEX_ASSEMBLY, CHROME_COVENANT, WRAITH_COURT }
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC }
    
    // Events
    event AvatarMinted(uint256 indexed tokenId, address indexed owner, Faction faction, Rarity rarity);
    event LoadoutBound(uint256 indexed tokenId, address indexed loadoutAddress);
    event LoadoutUnbound(uint256 indexed tokenId);
    event TraitsRevealed(uint256 indexed tokenId, bytes32 seed);
    
    // Core functions
    function mint(address to, Faction faction, bytes32 seed) external returns (uint256);
    function revealTraits(uint256 tokenId) external;
    function bindLoadout(uint256 tokenId, address loadoutAddress) external;
    function unbindLoadout(uint256 tokenId) external;
    
    // View functions
    function traits(uint256 tokenId) external view returns (
        bytes32 seed,
        uint8 faction,
        uint8 rarity,
        uint8[] memory traitValues,
        bool revealed,
        uint256 mintTimestamp
    );
    function getBoundLoadout(uint256 tokenId) external view returns (address);
    function getFactionAndRarity(uint256 tokenId) external view returns (Faction faction, Rarity rarity);
    function getMintStats() external view returns (uint256 totalSupply, uint256 minted);
    
    // Admin functions
    function setMintingEnabled(bool enabled) external;
    function setBaseURI(string memory newBaseURI) external;
    
    // Constants
    function MAX_SUPPLY() external view returns (uint256);
    function MAX_TRAITS() external view returns (uint256);
    function mintingEnabled() external view returns (bool);
    function factionMintCounts(Faction) external view returns (uint256);
    function rarityMintCounts(Rarity) external view returns (uint256);
}