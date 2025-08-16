// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/ICursedAvatar721.sol";

/**
 * @title CursedAvatar721
 * @dev Core avatar NFT contract for Cursed Faction MMO
 * Implements ERC-721 with trait system, faction integration, and loadout binding
 */
contract CursedAvatar721 is ERC721, ERC721URIStorage, Ownable, ICursedAvatar721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Constants
    uint256 public constant MAX_SUPPLY = 6666;
    uint256 public constant MAX_TRAITS = 8;
    
    // Enums
    enum Faction { GRAVEMIND_SYNDICATE, HEX_ASSEMBLY, CHROME_COVENANT, WRAITH_COURT }
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC }
    
    // State variables
    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    bool public mintingEnabled = false;
    
    // Trait storage
    mapping(uint256 => AvatarTraits) private _avatarTraits;
    mapping(uint256 => address) private _boundLoadouts;
    
    // Faction and rarity distributions
    mapping(Faction => uint256) public factionMintCounts;
    mapping(Rarity => uint256) public rarityMintCounts;
    
    // Events
    event AvatarMinted(uint256 indexed tokenId, address indexed owner, Faction faction, Rarity rarity);
    event LoadoutBound(uint256 indexed tokenId, address indexed loadoutAddress);
    event LoadoutUnbound(uint256 indexed tokenId);
    event TraitsRevealed(uint256 indexed tokenId, bytes32 seed);
    
    // Structs
    struct AvatarTraits {
        bytes32 seed;           // Deterministic trait seed
        Faction faction;        // Faction assignment
        Rarity rarity;          // Rarity tier
        uint8[] traitValues;    // Individual trait values (0-255)
        bool revealed;          // Whether traits have been revealed
        uint256 mintTimestamp;  // When the avatar was minted
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
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mints a new cursed avatar
     * @param to Address to mint to
     * @param faction Faction assignment
     * @param seed Trait seed for deterministic generation
     */
    function mint(
        address to,
        Faction faction,
        bytes32 seed
    ) external mintingAllowed returns (uint256) {
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Invalid recipient");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Generate rarity based on seed
        Rarity rarity = _generateRarity(seed);
        
        // Create and store traits
        _avatarTraits[tokenId] = AvatarTraits({
            seed: seed,
            faction: faction,
            rarity: rarity,
            traitValues: new uint8[](MAX_TRAITS),
            revealed: false,
            mintTimestamp: block.timestamp
        });
        
        // Update counters
        factionMintCounts[faction]++;
        rarityMintCounts[rarity]++;
        
        // Mint the token
        _safeMint(to, tokenId);
        
        emit AvatarMinted(tokenId, to, faction, rarity);
        
        return tokenId;
    }
    
    /**
     * @dev Reveals traits for a specific avatar
     * @param tokenId The avatar to reveal
     */
    function revealTraits(uint256 tokenId) external validTokenId(tokenId) {
        AvatarTraits storage traits = _avatarTraits[tokenId];
        require(!traits.revealed, "Traits already revealed");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
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
    {
        require(loadoutAddress != address(0), "Invalid loadout address");
        require(_boundLoadouts[tokenId] == address(0), "Loadout already bound");
        
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
    {
        require(_boundLoadouts[tokenId] != address(0), "No loadout bound");
        
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
        _baseTokenURI = newBaseURI;
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
    
    // Override functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up storage
        delete _avatarTraits[tokenId];
        delete _boundLoadouts[tokenId];
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
}