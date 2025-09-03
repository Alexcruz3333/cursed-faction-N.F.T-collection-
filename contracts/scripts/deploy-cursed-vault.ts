import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying CursedPiggyBankVault...");

  // Replace with the deployed CursedAvatar721 address
  const CURSED_AVATAR_721 = process.env.CURSED_AVATAR_721 as string;
  if (!CURSED_AVATAR_721) {
    throw new Error("Missing CURSED_AVATAR_721 env var");
  }

  const Vault = await ethers.getContractFactory("CursedPiggyBankVault");
  const vault = await Vault.deploy(CURSED_AVATAR_721);
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log(`✅ CursedPiggyBankVault deployed at: ${address}`);
  console.log(`   Avatar contract: ${CURSED_AVATAR_721}`);

  // Optional: prime a goal/lock for a known tokenId (example: 1)
  // const [deployer] = await ethers.getSigners();
  // await vault.setSavingsGoal(1, ethers.parseEther("1"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
