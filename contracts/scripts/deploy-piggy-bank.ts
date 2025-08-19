import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying PiggyBank NFT...");

  // Deploy the contract
  const PiggyBankNFT = await ethers.getContractFactory("PiggyBankNFT");
  const baseURI = "https://api.piggybanknft.com/metadata/"; // Update this to your metadata service
  
  const piggyBank = await PiggyBankNFT.deploy(baseURI);
  await piggyBank.waitForDeployment();

  const address = await piggyBank.getAddress();
  console.log(`✅ PiggyBank NFT deployed to: ${address}`);

  // Mint a few example NFTs
  const [deployer] = await ethers.getSigners();
  
  // Mint NFT #1 with a savings goal of 1 ETH and no time lock
  const goal1 = ethers.parseEther("1.0"); // 1 ETH goal
  const unlock1 = 0; // No time lock
  await piggyBank.mint(deployer.address, goal1, unlock1);
  console.log(`🎯 Minted NFT #1 with ${ethers.formatEther(goal1)} ETH goal`);

  // Mint NFT #2 with a time lock (unlocks in 30 days)
  const goal2 = ethers.parseEther("5.0"); // 5 ETH goal
  const unlock2 = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  await piggyBank.mint(deployer.address, goal2, unlock2);
  console.log(`🎯 Minted NFT #2 with ${ethers.formatEther(goal2)} ETH goal, unlocks in 30 days`);

  console.log("\n🎉 Deployment complete! You can now:");
  console.log(`1. View your NFTs at: ${address}`);
  console.log("2. Deposit ETH to any NFT using depositETH(tokenId)");
  console.log("3. Set savings goals and time locks");
  console.log("4. Withdraw funds when you're the owner");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
