import { ethers } from "hardhat";
import { CursedAvatar721, CursedGear1155, ShadowPowerArtifact } from "../typechain-types";

async function main() {
  console.log("🚀 Deploying Cursed Faction Shadow Powers System...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deploy Cursed Avatar contract
  console.log("📦 Deploying CursedAvatar721...");
  const CursedAvatar = await ethers.getContractFactory("CursedAvatar721");
  const cursedAvatar = await CursedAvatar.deploy(
    "Cursed Faction Avatar",
    "CURSED",
    "https://api.cursedfaction.com/avatars/"
  );
  await cursedAvatar.waitForDeployment();
  const avatarAddress = await cursedAvatar.getAddress();
  console.log(`✅ CursedAvatar721 deployed to: ${avatarAddress}`);

  // Deploy Cursed Gear contract
  console.log("\n⚔️ Deploying CursedGear1155...");
  const CursedGear = await ethers.getContractFactory("CursedGear1155");
  const cursedGear = await CursedGear.deploy("https://api.cursedfaction.com/gear/");
  await cursedGear.waitForDeployment();
  const gearAddress = await cursedGear.getAddress();
  console.log(`✅ CursedGear1155 deployed to: ${gearAddress}`);

  // Deploy Shadow Power Artifact contract
  console.log("\n🔮 Deploying ShadowPowerArtifact...");
  const ShadowArtifact = await ethers.getContractFactory("ShadowPowerArtifact");
  const shadowArtifact = await ShadowArtifact.deploy(
    "Shadow Power Artifacts",
    "SHADOW",
    "https://api.cursedfaction.com/artifacts/"
  );
  await shadowArtifact.waitForDeployment();
  const artifactAddress = await shadowArtifact.getAddress();
  console.log(`✅ ShadowPowerArtifact deployed to: ${artifactAddress}`);

  // Enable minting on all contracts
  console.log("\n🔓 Enabling minting on all contracts...");
  await cursedAvatar.setMintingEnabled(true);
  await cursedGear.setMintingEnabled(true);
  await shadowArtifact.setMintingEnabled(true);
  console.log("✅ Minting enabled on all contracts");

  // Set up crafting station for gear
  console.log("\n🏭 Setting up crafting station...");
  await cursedGear.setCraftingStation(deployer.address);
  console.log("✅ Crafting station set");

  // Set signer address for gear evolution
  console.log("\n✍️ Setting signer address...");
  await cursedGear.setSignerAddress(deployer.address);
  console.log("✅ Signer address set");

  // Test minting an avatar with shadow powers
  console.log("\n🎭 Testing avatar minting with shadow powers...");
  
  // Generate a deterministic seed
  const seed = ethers.keccak256(ethers.toUtf8Bytes("test-avatar-seed-1"));
  
  // Mint avatar (Gravemind Syndicate faction)
  const mintTx = await cursedAvatar.mint(deployer.address, 0, seed); // 0 = GRAVEMIND_SYNDICATE
  const mintReceipt = await mintTx.wait();
  
  // Get the minted token ID from events
  const mintEvent = mintReceipt?.logs.find(log => {
    try {
      const parsed = cursedAvatar.interface.parseLog(log);
      return parsed?.name === "AvatarMinted";
    } catch {
      return false;
    }
  });
  
  if (mintEvent) {
    const parsed = cursedAvatar.interface.parseLog(mintEvent);
    const tokenId = parsed?.args?.[0];
    console.log(`✅ Avatar minted with token ID: ${tokenId}`);
    
    // Get avatar traits and shadow power
    const traits = await cursedAvatar.traits(tokenId);
    const shadowPower = await cursedAvatar.getShadowPower(tokenId);
    
    console.log(`\n📊 Avatar Details:`);
    console.log(`   Faction: ${traits.faction}`);
    console.log(`   Rarity: ${traits.rarity}`);
    console.log(`   Shadow Power: ${shadowPower.power}`);
    console.log(`   Charges: ${shadowPower.currentCharges}/${shadowPower.maxCharges}`);
    console.log(`   Recharge Rate: ${shadowPower.needsRecharge ? "Needs Recharge" : "Fully Charged"}`);
    
    // Test shadow power usage
    console.log(`\n⚡ Testing shadow power usage...`);
    const usePowerTx = await cursedAvatar.useShadowPower(tokenId);
    await usePowerTx.wait();
    console.log("✅ Shadow power used");
    
    // Check remaining charges
    const updatedPower = await cursedAvatar.getShadowPower(tokenId);
    console.log(`   Remaining charges: ${updatedPower.currentCharges}`);
    
    // Test artifact minting and equipping
    console.log(`\n🔮 Testing artifact system...`);
    
    // Mint a shadow amplifier artifact
    const artifactTx = await shadowArtifact.mint(
      deployer.address,
      0, // SHADOW_AMPLIFIER
      2, // RARE
      3, // Power level 3
      5  // Max power level 5
    );
    const artifactReceipt = await artifactTx.wait();
    
    // Get artifact ID
    const artifactEvent = artifactReceipt?.logs.find(log => {
      try {
        const parsed = shadowArtifact.interface.parseLog(log);
        return parsed?.name === "ArtifactMinted";
      } catch {
        return false;
      }
    });
    
    if (artifactEvent) {
      const parsed = shadowArtifact.interface.parseLog(artifactEvent);
      const artifactId = parsed?.args?.[0];
      console.log(`✅ Artifact minted with ID: ${artifactId}`);
      
      // Equip artifact to avatar
      const equipTx = await shadowArtifact.equipArtifact(artifactId, tokenId);
      await equipTx.wait();
      console.log("✅ Artifact equipped to avatar");
      
      // Check power enhancement
      const enhancement = await shadowArtifact.getPowerEnhancement(artifactId, tokenId);
      console.log(`   Power enhancement level: ${enhancement}`);
      
      // Enhance artifact power
      const enhanceTx = await shadowArtifact.enhancePower(artifactId, tokenId, 1);
      await enhanceTx.wait();
      console.log("✅ Artifact power enhanced");
      
      // Check final enhancement
      const finalEnhancement = await shadowArtifact.getPowerEnhancement(artifactId, tokenId);
      console.log(`   Final enhancement level: ${finalEnhancement}`);
    }
  }

  // Test gear minting
  console.log(`\n⚔️ Testing gear system...`);
  
  // Mint some gear
  const gearTx = await cursedGear.mint(
    deployer.address,
    1, // Gear ID
    5, // Amount
    0, // WEAPON_PISTOL
    2, // Tier 2
    4, // Max tier 4
    "shadow_steel", // Style modifier
    true // Evolvable
  );
  await gearTx.wait();
  console.log("✅ Gear minted successfully");

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SHADOW POWERS SYSTEM DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log(`📍 CursedAvatar721: ${avatarAddress}`);
  console.log(`📍 CursedGear1155: ${gearAddress}`);
  console.log(`📍 ShadowPowerArtifact: ${artifactAddress}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log("=".repeat(60));
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Test shadow power mechanics in-game");
  console.log("3. Deploy to testnet for community testing");
  console.log("4. Integrate with Unreal Engine 5 game client");
  
  console.log("\n📚 Documentation:");
  console.log("- Shadow Powers Guide: docs/shadow-powers.md");
  console.log("- Smart Contract ABI: contracts/artifacts/");
  console.log("- Game Design Document: docs/game-design.md");

  // Save deployment addresses
  const deploymentInfo = {
    network: "hardhat",
    deployer: deployer.address,
    contracts: {
      cursedAvatar: avatarAddress,
      cursedGear: gearAddress,
      shadowArtifact: artifactAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });