import { expect } from "chai";
import { ethers } from "hardhat";
import { PiggyBankNFT } from "../typechain-types";
import { SignerWithAddress } from "@ethersproject/contracts";

describe("PiggyBankNFT", function () {
  let piggyBank: PiggyBankNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const PiggyBankNFT = await ethers.getContractFactory("PiggyBankNFT");
    piggyBank = await PiggyBankNFT.deploy("https://api.example.com/");
  });

  describe("Minting", function () {
    it("Should mint NFTs with goals and time locks", async function () {
      const goal = ethers.parseEther("1.0");
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await piggyBank.mint(user1.address, goal, unlockTime);
      
      expect(await piggyBank.ownerOf(1)).to.equal(user1.address);
      expect(await piggyBank.savingsGoal(1)).to.equal(goal);
      expect(await piggyBank.unlockTime(1)).to.equal(unlockTime);
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      await piggyBank.mint(user1.address, 0, 0);
    });

    it("Should accept ETH deposits", async function () {
      const depositAmount = ethers.parseEther("0.1");
      
      await piggyBank.connect(user2).depositETH(1, { value: depositAmount });
      
      expect(await piggyBank.ethBalance(1)).to.equal(depositAmount);
    });

    it("Should reject zero value deposits", async function () {
      await expect(
        piggyBank.connect(user2).depositETH(1, { value: 0 })
      ).to.be.revertedWith("no value");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await piggyBank.mint(user1.address, 0, 0);
      await piggyBank.connect(user2).depositETH(1, { value: ethers.parseEther("1.0") });
    });

    it("Should allow owner to withdraw ETH", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const withdrawAmount = ethers.parseEther("0.5");
      
      await piggyBank.connect(user1).withdrawETH(1, withdrawAmount);
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await piggyBank.ethBalance(1)).to.equal(ethers.parseEther("0.5"));
    });

    it("Should prevent non-owners from withdrawing", async function () {
      await expect(
        piggyBank.connect(user2).withdrawETH(1, ethers.parseEther("0.1"))
      ).to.be.revertedWith("not owner");
    });
  });

  describe("Time Locks", function () {
    it("Should prevent withdrawals before unlock time", async function () {
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await piggyBank.mint(user1.address, 0, unlockTime);
      await piggyBank.connect(user2).depositETH(1, { value: ethers.parseEther("1.0") });
      
      await expect(
        piggyBank.connect(user1).withdrawETH(1, ethers.parseEther("0.1"))
      ).to.be.revertedWith("locked");
    });
  });
});
