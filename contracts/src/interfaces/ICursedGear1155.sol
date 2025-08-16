// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICursedGear1155
 * @dev Interface for Cursed Gear NFT contract
 */
interface ICursedGear1155 {
    // Enums
    enum GearType { 
        WEAPON_PISTOL, WEAPON_SMG, WEAPON_AR, WEAPON_BR, WEAPON_SHOTGUN, WEAPON_LMG, WEAPON_SNIPER,
        ARMOR_RELIQUARY, ARMOR_RUNIC, ARMOR_GRAFTED, ARMOR_WRAITHWEAVE,
        MELEE_BLADE, MELEE_HAMMER, MELEE_CHAIN,
        THROWABLE, SIGIL, COSMETIC
    }
    
    // Events
    event GearMinted(uint256 indexed id, address indexed to, uint256 amount, GearType gearType, uint8 tier);
    event GearEvolved(uint256 indexed oldId, uint256 indexed newId, address indexed owner, uint8 newTier);
    event GearBurned(uint256 indexed id, address indexed from, uint256 amount);
    event CraftingStationSet(address indexed oldStation, address indexed newStation);
    event SignerAddressSet(address indexed oldSigner, address indexed newSigner);
    
    // Core functions
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        GearType gearType,
        uint8 tier,
        uint8 maxTier,
        string memory styleModifier,
        bool evolvable
    ) external returns (bool);
    
    function evolve(
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory signature,
        uint256 newId,
        uint8 newTier
    ) external returns (uint256);
    
    function burn(address from, uint256 id, uint256 amount) external;
    
    // View functions
    function getGearData(uint256 id) external view returns (
        GearType gearType,
        uint8 tier,
        uint8 maxTier,
        string memory styleModifier,
        bool evolvable,
        uint256 mintTimestamp
    );
    
    function getEvolutionTier(uint256 id) external view returns (uint256);
    function getEvolutionHistory(uint256 id) external view returns (uint256[] memory);
    function totalSupply(uint256 id) external view returns (uint256);
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory);
    
    // Admin functions
    function setMintingEnabled(bool enabled) external;
    function setCraftingStation(address newStation) external;
    function setSignerAddress(address newSigner) external;
    function setBaseURI(string memory newBaseURI) external;
    
    // Constants
    function MAX_EVOLUTION_TIER() external view returns (uint256);
    function EVOLUTION_COST() external view returns (uint256);
    function mintingEnabled() external view returns (bool);
    function craftingStation() external view returns (address);
    function signerAddress() external view returns (address);
}