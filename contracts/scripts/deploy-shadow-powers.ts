import { ethers, upgrades } from "hardhat";
import { verify } from "./utils/verify";
import { saveDeploymentInfo } from "./utils/deployment-utils";

async function main() {
  console.log("🚀 Deploying Cursed Faction NFT Collection...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Network configuration
  const network = await ethers.provider.getNetwork();
  const isTestnet = network.chainId === 11155111n || network.chainId === 84532n; // Sepolia or Base Sepolia
  const isMainnet = network.chainId === 1n || network.chainId === 8453n; // Ethereum or Base

  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`🔧 Environment: ${isMainnet ? 'MAINNET' : isTestnet ? 'TESTNET' : 'LOCAL'}`);

  try {
    // Deploy CursedAvatar721
    console.log("\n🎭 Deploying CursedAvatar721...");
    const CursedAvatar721 = await ethers.getContractFactory("CursedAvatar721");
    const cursedAvatar = await CursedAvatar721.deploy(
      "Cursed Faction Avatar",
      "CURSED",
      "https://api.cursedfaction.com/avatars/"
    );
    await cursedAvatar.waitForDeployment();
    const avatarAddress = await cursedAvatar.getAddress();
    console.log(`✅ CursedAvatar721 deployed to: ${avatarAddress}`);

    // Deploy CursedGear1155
    console.log("\n⚔️ Deploying CursedGear1155...");
    const CursedGear1155 = await ethers.getContractFactory("CursedGear1155");
    const cursedGear = await CursedGear1155.deploy(
      "https://api.cursedfaction.com/gear/"
    );
    await cursedGear.waitForDeployment();
    const gearAddress = await cursedGear.getAddress();
    console.log(`✅ CursedGear1155 deployed to: ${gearAddress}`);

    // Deploy ShadowPowerArtifact
    console.log("\n🔮 Deploying ShadowPowerArtifact...");
    const ShadowPowerArtifact = await ethers.getContractFactory("ShadowPowerArtifact");
    const shadowArtifact = await ShadowPowerArtifact.deploy(
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
      console.log("✅ Shadow artifact minted");

      // Test gear minting
      console.log(`\n⚔️ Testing gear system...`);
      
      // Mint some gear
      const gearTx = await cursedGear.mint(
        deployer.address,
        1001, // Weapon ID
        10,   // Amount
        "0x" // No data
      );
      await gearTx.wait();
      console.log("✅ Gear minted");
    }

    // Summary
    console.log("\n🎉 Deployment Summary:");
    console.log(`   CursedAvatar721: ${avatarAddress}`);
    console.log(`   CursedGear1155: ${gearAddress}`);
    console.log(`   ShadowPowerArtifact: ${artifactAddress}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Network: ${network.name} (${network.chainId})`);

    // Save deployment info if utils are available
    try {
      await saveDeploymentInfo({
        network: network.name,
        chainId: Number(network.chainId),
        contracts: {
          CursedAvatar721: avatarAddress,
          CursedGear1155: gearAddress,
          ShadowPowerArtifact: artifactAddress
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString()
      });
      console.log("📝 Deployment info saved");
    } catch (e) {
      console.log("⚠️ Could not save deployment info (utils not available)");
    }

    // Verify on block explorer if on testnet/mainnet
    if (isTestnet || isMainnet) {
      console.log("\n🔍 Verifying contracts on block explorer...");
      try {
        await verify(avatarAddress, [
          "Cursed Faction Avatar",
          "CURSED", 
          "https://api.cursedfaction.com/avatars/"
        ]);
        await verify(gearAddress, ["https://api.cursedfaction.com/gear/"]);
        await verify(artifactAddress, [
          "Shadow Power Artifacts",
          "SHADOW",
          "https://api.cursedfaction.com/artifacts/"
        ]);
        console.log("✅ All contracts verified");
      } catch (e) {
        console.log("⚠️ Verification failed (utils not available or already verified)");
      }
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n✨ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });