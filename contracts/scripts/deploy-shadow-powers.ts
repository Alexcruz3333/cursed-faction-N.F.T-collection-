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
    const shadowPowerArtifact = await ShadowPowerArtifact.deploy(
      "Shadow Power Artifact",
      "SPA",
      "https://api.cursedfaction.com/artifacts/"
    );
    await shadowPowerArtifact.waitForDeployment();
    const artifactAddress = await shadowPowerArtifact.getAddress();
    console.log(`✅ ShadowPowerArtifact deployed to: ${artifactAddress}`);

    // Wait for a few block confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    await cursedAvatar.deploymentTransaction()?.wait(5);
    await cursedGear.deploymentTransaction()?.wait(5);
    await shadowPowerArtifact.deploymentTransaction()?.wait(5);

    // Configure contracts
    console.log("\n⚙️ Configuring contracts...");
    
    // Set minting enabled on testnet/mainnet
    if (!isMainnet) {
      console.log("🔓 Enabling minting on testnet...");
      await cursedAvatar.setMintingEnabled(true);
      await cursedGear.setMintingEnabled(true);
      await shadowPowerArtifact.setMintingEnabled(true);
      console.log("✅ Minting enabled");
    }

    // Set crafting station (can be updated later)
    console.log("🏭 Setting crafting station...");
    await cursedGear.setCraftingStation(deployer.address);
    console.log("✅ Crafting station set");

    // Set signer address for gear evolution
    console.log("✍️ Setting signer address...");
    await cursedGear.setSignerAddress(deployer.address);
    console.log("✅ Signer address set");

    // Save deployment information
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      contracts: {
        CursedAvatar721: {
          address: avatarAddress,
          constructorArgs: [
            "Cursed Faction Avatar",
            "CURSED",
            "https://api.cursedfaction.com/avatars/"
          ]
        },
        CursedGear1155: {
          address: gearAddress,
          constructorArgs: [
            "https://api.cursedfaction.com/gear/"
          ]
        },
        ShadowPowerArtifact: {
          address: artifactAddress,
          constructorArgs: [
            "Shadow Power Artifact",
            "SPA",
            "https://api.cursedfaction.com/artifacts/"
          ]
        }
      },
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };

    await saveDeploymentInfo(network.name, deploymentInfo);
    console.log("💾 Deployment information saved");

    // Verify contracts on testnet/mainnet
    if (isTestnet || isMainnet) {
      console.log("\n🔍 Verifying contracts on Etherscan...");
      
      try {
        await verify(avatarAddress, [
          "Cursed Faction Avatar",
          "CURSED",
          "https://api.cursedfaction.com/avatars/"
        ]);
        console.log("✅ CursedAvatar721 verified");
      } catch (error) {
        console.log("⚠️ CursedAvatar721 verification failed:", error);
      }

      try {
        await verify(gearAddress, [
          "https://api.cursedfaction.com/gear/"
        ]);
        console.log("✅ CursedGear1155 verified");
      } catch (error) {
        console.log("⚠️ CursedGear1155 verification failed:", error);
      }

      try {
        await verify(artifactAddress, [
          "Shadow Power Artifact",
          "SPA",
          "https://api.cursedfaction.com/artifacts/"
        ]);
        console.log("✅ ShadowPowerArtifact verified");
      } catch (error) {
        console.log("⚠️ ShadowPowerArtifact verification failed:", error);
      }
    }

    // Display deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log(`🌐 Network: ${network.name} (${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`🎭 CursedAvatar721: ${avatarAddress}`);
    console.log(`⚔️ CursedGear1155: ${gearAddress}`);
    console.log(`🔮 ShadowPowerArtifact: ${artifactAddress}`);
    console.log(`📅 Timestamp: ${deploymentInfo.timestamp}`);
    console.log(`🔢 Block Number: ${deploymentInfo.blockNumber}`);

    // Display next steps
    console.log("\n🚀 Next Steps:");
    console.log("1. Update frontend configuration with contract addresses");
    console.log("2. Set up metadata API endpoints");
    console.log("3. Configure crafting station address");
    console.log("4. Set up signer wallet for gear evolution");
    console.log("5. Test minting and core functionality");
    
    if (isMainnet) {
      console.log("6. ⚠️ IMPORTANT: Review and configure minting settings for mainnet");
      console.log("7. Set appropriate mint prices and limits");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  });