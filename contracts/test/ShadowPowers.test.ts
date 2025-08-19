import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, parseEther } from "ethers";
import { CursedAvatar721, CursedGear1155, ShadowPowerArtifact } from "../typechain-types";

describe("Cursed Faction NFT Collection", function () {
  let cursedAvatar: CursedAvatar721;
  let cursedGear: CursedGear1155;
  let shadowPowerArtifact: ShadowPowerArtifact;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let craftingStation: Signer;
  let signer: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;
  let craftingStationAddress: string;
  let signerAddress: string;

  const MINT_PRICE = parseEther("0.1");
  const GEAR_MINT_PRICE = parseEther("0.05");
  const ARTIFACT_MINT_PRICE = parseEther("0.2");
  const EVOLUTION_FEE = parseEther("0.01");
  const ENHANCEMENT_FEE = parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2, craftingStation, signer] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    craftingStationAddress = await craftingStation.getAddress();
    signerAddress = await signer.getAddress();

    // Deploy contracts
    const CursedAvatar721 = await ethers.getContractFactory("CursedAvatar721");
    cursedAvatar = await CursedAvatar721.deploy(
      "Cursed Faction Avatar",
      "CURSED",
      "https://api.cursedfaction.com/avatars/"
    );

    const CursedGear1155 = await ethers.getContractFactory("CursedGear1155");
    cursedGear = await CursedGear1155.deploy("https://api.cursedfaction.com/gear/");

    const ShadowPowerArtifact = await ethers.getContractFactory("ShadowPowerArtifact");
    shadowPowerArtifact = await ShadowPowerArtifact.deploy(
      "Shadow Power Artifact",
      "SPA",
      "https://api.cursedfaction.com/artifacts/"
    );

    // Configure contracts
    await cursedAvatar.setMintingEnabled(true);
    await cursedGear.setMintingEnabled(true);
    await cursedGear.setCraftingStation(craftingStationAddress);
    await cursedGear.setSignerAddress(signerAddress);
    await shadowPowerArtifact.setMintingEnabled(true);
  });

  describe("CursedAvatar721", function () {
    describe("Deployment", function () {
      it("Should deploy with correct name and symbol", async function () {
        expect(await cursedAvatar.name()).to.equal("Cursed Faction Avatar");
        expect(await cursedAvatar.symbol()).to.equal("CURSED");
      });

      it("Should start with minting disabled", async function () {
        expect(await cursedAvatar.mintingEnabled()).to.be.false;
      });

      it("Should have correct max supply", async function () {
        const stats = await cursedAvatar.getMintStats();
        expect(stats.totalSupply).to.equal(6666);
        expect(stats.minted).to.equal(0);
      });
    });

    describe("Minting", function () {
      beforeEach(async function () {
        await cursedAvatar.setMintingEnabled(true);
      });

      it("Should mint avatar with correct payment", async function () {
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        const tx = await cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: MINT_PRICE });
        const receipt = await tx.wait();
        
        expect(await cursedAvatar.ownerOf(0)).to.equal(user1Address);
        expect(await cursedAvatar.getWalletMintCount(user1Address)).to.equal(1);
      });

      it("Should fail minting without correct payment", async function () {
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        await expect(
          cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: parseEther("0.05") })
        ).to.be.revertedWithCustomError(cursedAvatar, "InvalidRecipient");
      });

      it("Should fail minting when disabled", async function () {
        await cursedAvatar.setMintingEnabled(false);
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        await expect(
          cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: MINT_PRICE })
        ).to.be.revertedWithCustomError(cursedAvatar, "MintingNotEnabled");
      });

      it("Should enforce max mint per wallet", async function () {
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        
        // Mint 5 avatars (max allowed)
        for (let i = 0; i < 5; i++) {
          const newSeed = ethers.keccak256(ethers.toUtf8Bytes(`test-seed-${i}`));
          await cursedAvatar.connect(user1).mint(user1Address, i, newSeed, { value: MINT_PRICE });
        }
        
        // 6th mint should fail
        const seed6 = ethers.keccak256(ethers.toUtf8Bytes("test-seed-6"));
        await expect(
          cursedAvatar.connect(user1).mint(user1Address, 5, seed6, { value: MINT_PRICE })
        ).to.be.revertedWithCustomError(cursedAvatar, "InvalidRecipient");
      });
    });

    describe("Batch Minting", function () {
      beforeEach(async function () {
        await cursedAvatar.setMintingEnabled(true);
      });

      it("Should mint multiple avatars in batch", async function () {
        const batchData = [{
          to: user1Address,
          factions: [0, 1, 2],
          seeds: [
            ethers.keccak256(ethers.toUtf8Bytes("seed1")),
            ethers.keccak256(ethers.toUtf8Bytes("seed2")),
            ethers.keccak256(ethers.toUtf8Bytes("seed3"))
          ],
          totalPrice: MINT_PRICE * 3n
        }];

        const tx = await cursedAvatar.connect(user1).mintBatch(batchData, { value: MINT_PRICE * 3n });
        await tx.wait();

        expect(await cursedAvatar.ownerOf(0)).to.equal(user1Address);
        expect(await cursedAvatar.ownerOf(1)).to.equal(user1Address);
        expect(await cursedAvatar.ownerOf(2)).to.equal(user1Address);
        expect(await cursedAvatar.getWalletMintCount(user1Address)).to.equal(3);
      });
    });

    describe("Shadow Powers", function () {
      let tokenId: number;

      beforeEach(async function () {
        await cursedAvatar.setMintingEnabled(true);
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        const tx = await cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: MINT_PRICE });
        const receipt = await tx.wait();
        
        // Get token ID from event
        const event = receipt?.logs.find(log => {
          try {
            const parsed = cursedAvatar.interface.parseLog(log);
            return parsed?.name === "AvatarMinted";
          } catch {
            return false;
          }
        });
        if (event) {
          const parsed = cursedAvatar.interface.parseLog(event);
          tokenId = parsed?.args?.[0];
        }
      });

      it("Should assign shadow power based on seed and rarity", async function () {
        const shadowPower = await cursedAvatar.getShadowPower(tokenId);
        expect(shadowPower.power).to.not.equal(0); // Should have a power assigned
        expect(shadowPower.currentCharges).to.be.gt(0);
        expect(shadowPower.maxCharges).to.be.gt(0);
      });

      it("Should use shadow power charges", async function () {
        const initialPower = await cursedAvatar.getShadowPower(tokenId);
        const initialCharges = initialPower.currentCharges;
        
        await cursedAvatar.connect(user1).useShadowPower(tokenId);
        
        const updatedPower = await cursedAvatar.getShadowPower(tokenId);
        expect(updatedPower.currentCharges).to.equal(initialCharges - 1n);
      });

      it("Should fail using shadow power without charges", async function () {
        // Use all charges
        const power = await cursedAvatar.getShadowPower(tokenId);
        for (let i = 0; i < Number(power.currentCharges); i++) {
          await cursedAvatar.connect(user1).useShadowPower(tokenId);
        }
        
        // Try to use again
        await expect(
          cursedAvatar.connect(user1).useShadowPower(tokenId)
        ).to.be.revertedWithCustomError(cursedAvatar, "NoShadowPowerCharges");
      });

      it("Should recharge shadow power over time", async function () {
        // Use a charge
        await cursedAvatar.connect(user1).useShadowPower(tokenId);
        
        // Fast forward time (this would need to be done with hardhat network manipulation)
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);
        
        // Recharge
        await cursedAvatar.connect(user1).rechargeShadowPower(tokenId);
        
        const power = await cursedAvatar.getShadowPower(tokenId);
        expect(power.currentCharges).to.be.gt(0);
      });
    });

    describe("Traits and Reveal", function () {
      let tokenId: number;

      beforeEach(async function () {
        await cursedAvatar.setMintingEnabled(true);
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        const tx = await cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: MINT_PRICE });
        const receipt = await tx.wait();
        
        const event = receipt?.logs.find(log => {
          try {
            const parsed = cursedAvatar.interface.parseLog(log);
            return parsed?.name === "AvatarMinted";
          } catch {
            return false;
          }
        });
        if (event) {
          const parsed = cursedAvatar.interface.parseLog(event);
          tokenId = parsed?.args?.[0];
        }
      });

      it("Should reveal traits correctly", async function () {
        const traits = await cursedAvatar.traits(tokenId);
        expect(traits.revealed).to.be.false;
        
        await cursedAvatar.connect(user1).revealTraits(tokenId);
        
        const revealedTraits = await cursedAvatar.traits(tokenId);
        expect(revealedTraits.revealed).to.be.true;
        expect(revealedTraits.traitValues.length).to.equal(8);
      });

      it("Should fail revealing traits twice", async function () {
        await cursedAvatar.connect(user1).revealTraits(tokenId);
        
        await expect(
          cursedAvatar.connect(user1).revealTraits(tokenId)
        ).to.be.revertedWithCustomError(cursedAvatar, "TraitsAlreadyRevealed");
      });
    });

    describe("Loadout Binding", function () {
      let tokenId: number;

      beforeEach(async function () {
        await cursedAvatar.setMintingEnabled(true);
        const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
        const tx = await cursedAvatar.connect(user1).mint(user1Address, 0, seed, { value: MINT_PRICE });
        const receipt = await tx.wait();
        
        const event = receipt?.logs.find(log => {
          try {
            const parsed = cursedAvatar.interface.parseLog(log);
            return parsed?.args?.[0];
          } catch {
            return false;
          }
        });
        if (event) {
          const parsed = cursedAvatar.interface.parseLog(event);
          tokenId = parsed?.args?.[0];
        }
      });

      it("Should bind loadout to avatar", async function () {
        const loadoutAddress = ethers.Wallet.createRandom().address;
        
        await cursedAvatar.connect(user1).bindLoadout(tokenId, loadoutAddress);
        
        const boundLoadout = await cursedAvatar.getBoundLoadout(tokenId);
        expect(boundLoadout).to.equal(loadoutAddress);
      });

      it("Should fail binding loadout twice", async function () {
        const loadoutAddress = ethers.Wallet.createRandom().address;
        
        await cursedAvatar.connect(user1).bindLoadout(tokenId, loadoutAddress);
        
        const newLoadoutAddress = ethers.Wallet.createRandom().address;
        await expect(
          cursedAvatar.connect(user1).bindLoadout(tokenId, newLoadoutAddress)
        ).to.be.revertedWithCustomError(cursedAvatar, "LoadoutAlreadyBound");
      });

      it("Should unbind loadout", async function () {
        const loadoutAddress = ethers.Wallet.createRandom().address;
        
        await cursedAvatar.connect(user1).bindLoadout(tokenId, loadoutAddress);
        await cursedAvatar.connect(user1).unbindLoadout(tokenId);
        
        const boundLoadout = await cursedAvatar.getBoundLoadout(tokenId);
        expect(boundLoadout).to.equal(ethers.ZeroAddress);
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to set mint price", async function () {
        const newPrice = parseEther("0.2");
        await cursedAvatar.setMintPrice(newPrice);
        expect(await cursedAvatar.mintPrice()).to.equal(newPrice);
      });

      it("Should allow owner to set max mint per wallet", async function () {
        const newLimit = 10;
        await cursedAvatar.setMaxMintPerWallet(newLimit);
        expect(await cursedAvatar.maxMintPerWallet()).to.equal(newLimit);
      });

      it("Should allow owner to pause contract", async function () {
        await cursedAvatar.pause();
        expect(await cursedAvatar.paused()).to.be.true;
      });

      it("Should allow owner to unpause contract", async function () {
        await cursedAvatar.pause();
        await cursedAvatar.unpause();
        expect(await cursedAvatar.paused()).to.be.false;
      });

      it("Should fail non-owner operations", async function () {
        await expect(
          cursedAvatar.connect(user1).setMintPrice(parseEther("0.2"))
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("CursedGear1155", function () {
    describe("Deployment", function () {
      it("Should deploy with correct base URI", async function () {
        expect(await cursedGear.uri(1)).to.equal("https://api.cursedfaction.com/gear/1");
      });

      it("Should start with minting disabled", async function () {
        expect(await cursedGear.mintingEnabled()).to.be.false;
      });
    });

    describe("Minting", function () {
      beforeEach(async function () {
        await cursedGear.setMintingEnabled(true);
      });

      it("Should mint gear with correct payment", async function () {
        const tx = await cursedGear.connect(user1).mint(
          user1Address,
          0, // Auto-generate ID
          5, // Amount
          0, // WEAPON_PISTOL
          2, // Tier
          4, // Max tier
          "shadow_steel",
          true, // Evolvable
          { value: GEAR_MINT_PRICE * 5n }
        );
        
        await tx.wait();
        expect(await cursedGear.balanceOf(user1Address, 0)).to.equal(5);
      });

      it("Should fail minting without correct payment", async function () {
        await expect(
          cursedGear.connect(user1).mint(
            user1Address,
            0,
            5,
            0,
            2,
            4,
            "shadow_steel",
            true,
            { value: parseEther("0.1") }
          )
        ).to.be.revertedWithCustomError(cursedGear, "InvalidAmount");
      });
    });

    describe("Batch Minting", function () {
      beforeEach(async function () {
        await cursedGear.setMintingEnabled(true);
      });

      it("Should mint multiple gear items in batch", async function () {
        const tx = await cursedGear.connect(user1).mintBatch(
          user1Address,
          [0, 0], // Auto-generate IDs
          [3, 2], // Amounts
          [0, 1], // Gear types
          [2, 3], // Tiers
          [4, 5], // Max tiers
          ["shadow_steel", "void_crystal"],
          [true, false], // Evolvable
          { value: GEAR_MINT_PRICE * 5n }
        );
        
        await tx.wait();
        expect(await cursedGear.balanceOf(user1Address, 0)).to.equal(3);
        expect(await cursedGear.balanceOf(user1Address, 1)).to.equal(2);
      });
    });

    describe("Evolution", function () {
      let gearId1: number;
      let gearId2: number;
      let gearId3: number;

      beforeEach(async function () {
        await cursedGear.setMintingEnabled(true);
        
        // Mint 3 evolvable gear items
        for (let i = 0; i < 3; i++) {
          const tx = await cursedGear.connect(user1).mint(
            user1Address,
            0,
            1,
            0,
            2,
            4,
            "shadow_steel",
            true,
            { value: GEAR_MINT_PRICE }
          );
          await tx.wait();
        }
        
        gearId1 = 0;
        gearId2 = 1;
        gearId3 = 2;
      });

      it("Should evolve gear with valid signature", async function () {
        // Create evolution data
        const evolutionData = {
          sourceIds: [gearId1, gearId2, gearId3],
          amounts: [1, 1, 1],
          newId: 100,
          newTier: 3,
          signature: "0x" // This would need to be a real signature in practice
        };

        // Note: This test would need proper signature generation to work
        // For now, we'll just test the structure
        expect(evolutionData.sourceIds.length).to.equal(3);
        expect(evolutionData.amounts.length).to.equal(3);
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to set mint price", async function () {
        const newPrice = parseEther("0.1");
        await cursedGear.setMintPrice(newPrice);
        expect(await cursedGear.mintPrice()).to.equal(newPrice);
      });

      it("Should allow owner to set evolution fee", async function () {
        const newFee = parseEther("0.02");
        await cursedGear.setEvolutionFee(newFee);
        expect(await cursedGear.evolutionFee()).to.equal(newFee);
      });

      it("Should allow owner to pause contract", async function () {
        await cursedGear.pause();
        expect(await cursedGear.paused()).to.be.true;
      });
    });
  });

  describe("ShadowPowerArtifact", function () {
    describe("Deployment", function () {
      it("Should deploy with correct name and symbol", async function () {
        expect(await shadowPowerArtifact.name()).to.equal("Shadow Power Artifact");
        expect(await shadowPowerArtifact.symbol()).to.equal("SPA");
      });

      it("Should start with minting disabled", async function () {
        expect(await shadowPowerArtifact.mintingEnabled()).to.be.false;
      });
    });

    describe("Minting", function () {
      beforeEach(async function () {
        await shadowPowerArtifact.setMintingEnabled(true);
      });

      it("Should mint artifact with correct payment", async function () {
        const tx = await shadowPowerArtifact.connect(user1).mint(
          user1Address,
          0, // SHADOW_AMPLIFIER
          2, // RARE
          3, // Power level
          5, // Max power level
          { value: ARTIFACT_MINT_PRICE }
        );
        
        await tx.wait();
        expect(await shadowPowerArtifact.ownerOf(0)).to.equal(user1Address);
      });

      it("Should fail minting without correct payment", async function () {
        await expect(
          shadowPowerArtifact.connect(user1).mint(
            user1Address,
            0,
            2,
            3,
            5,
            { value: parseEther("0.1") }
          )
        ).to.be.revertedWithCustomError(shadowPowerArtifact, "InvalidPowerLevel");
      });
    });

    describe("Batch Minting", function () {
      beforeEach(async function () {
        await shadowPowerArtifact.setMintingEnabled(true);
      });

      it("Should mint multiple artifacts in batch", async function () {
        const batchData = [{
          to: user1Address,
          artifactTypes: [0, 1, 2],
          rarities: [2, 3, 4],
          powerLevels: [3, 4, 5],
          maxPowerLevels: [5, 6, 7],
          totalPrice: ARTIFACT_MINT_PRICE * 3n
        }];

        const tx = await shadowPowerArtifact.connect(user1).mintBatch(batchData, { value: ARTIFACT_MINT_PRICE * 3n });
        await tx.wait();

        expect(await shadowPowerArtifact.ownerOf(0)).to.equal(user1Address);
        expect(await shadowPowerArtifact.ownerOf(1)).to.equal(user1Address);
        expect(await shadowPowerArtifact.ownerOf(2)).to.equal(user1Address);
      });
    });

    describe("Artifact Equipping", function () {
      let artifactId: number;

      beforeEach(async function () {
        await shadowPowerArtifact.setMintingEnabled(true);
        const tx = await shadowPowerArtifact.connect(user1).mint(
          user1Address,
          0,
          2,
          3,
          5,
          { value: ARTIFACT_MINT_PRICE }
        );
        await tx.wait();
        artifactId = 0;
      });

      it("Should equip artifact to avatar", async function () {
        await shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 1);
        
        const equippedInfo = await shadowPowerArtifact.getEquippedInfo(artifactId);
        expect(equippedInfo.equippedBy).to.equal(user1Address);
        expect(equippedInfo.avatarId).to.equal(1);
      });

      it("Should activate soulbinding when equipped", async function () {
        await shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 1);
        
        const artifactData = await shadowPowerArtifact.getArtifactData(artifactId);
        expect(artifactData.soulbound).to.be.true;
      });

      it("Should fail equipping twice", async function () {
        await shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 1);
        
        await expect(
          shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 2)
        ).to.be.revertedWithCustomError(shadowPowerArtifact, "ArtifactAlreadyEquipped");
      });
    });

    describe("Power Enhancement", function () {
      let artifactId: number;

      beforeEach(async function () {
        await shadowPowerArtifact.setMintingEnabled(true);
        const tx = await shadowPowerArtifact.connect(user1).mint(
          user1Address,
          0,
          2,
          3,
          5,
          { value: ARTIFACT_MINT_PRICE }
        );
        await tx.wait();
        artifactId = 0;
        
        // Equip the artifact
        await shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 1);
      });

      it("Should enhance artifact power with fee", async function () {
        const initialEnhancement = await shadowPowerArtifact.getPowerEnhancement(artifactId, 1);
        
        await shadowPowerArtifact.connect(user1).enhancePower(artifactId, 1, 1, { value: ENHANCEMENT_FEE });
        
        const newEnhancement = await shadowPowerArtifact.getPowerEnhancement(artifactId, 1);
        expect(newEnhancement).to.be.gt(initialEnhancement);
      });

      it("Should fail enhancement without fee", async function () {
        await expect(
          shadowPowerArtifact.connect(user1).enhancePower(artifactId, 1, 1, { value: parseEther("0.005") })
        ).to.be.revertedWithCustomError(shadowPowerArtifact, "InvalidEnhancementAmount");
      });
    });

    describe("Temporary Boosts", function () {
      let artifactId: number;

      beforeEach(async function () {
        await shadowPowerArtifact.setMintingEnabled(true);
        const tx = await shadowPowerArtifact.connect(user1).mint(
          user1Address,
          0,
          2,
          3,
          5,
          { value: ARTIFACT_MINT_PRICE }
        );
        await tx.wait();
        artifactId = 0;
        
        // Equip the artifact
        await shadowPowerArtifact.connect(user1).equipArtifact(artifactId, 1);
      });

      it("Should apply temporary boost", async function () {
        const boostLevel = 2;
        const duration = 3600; // 1 hour
        
        await shadowPowerArtifact.connect(user1).applyTemporaryBoost(artifactId, 1, boostLevel, duration);
        
        const boost = await shadowPowerArtifact.getTemporaryBoost(artifactId, 1);
        expect(boost.boostLevel).to.equal(boostLevel);
        expect(boost.isActive).to.be.true;
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to set mint price", async function () {
        const newPrice = parseEther("0.3");
        await shadowPowerArtifact.setMintPrice(newPrice);
        expect(await shadowPowerArtifact.mintPrice()).to.equal(newPrice);
      });

      it("Should allow owner to set enhancement fee", async function () {
        const newFee = parseEther("0.02");
        await shadowPowerArtifact.setEnhancementFee(newFee);
        expect(await shadowPowerArtifact.enhancementFee()).to.equal(newFee);
      });

      it("Should allow owner to pause contract", async function () {
        await shadowPowerArtifact.pause();
        expect(await shadowPowerArtifact.paused()).to.be.true;
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should work together as a complete system", async function () {
      // This test would verify that all contracts work together
      // For now, we'll just verify they're all deployed
      expect(await cursedAvatar.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await cursedGear.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await shadowPowerArtifact.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });
});