import { expect } from "chai";
import { ethers } from "hardhat";
import { CursedAvatar721, CursedGear1155, ShadowPowerArtifact } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Cursed Faction - Shadow Powers System", function () {
  let cursedAvatar: CursedAvatar721;
  let cursedGear: CursedGear1155;
  let shadowArtifact: ShadowPowerArtifact;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy contracts
    const CursedAvatar = await ethers.getContractFactory("CursedAvatar721");
    cursedAvatar = await CursedAvatar.deploy(
      "Cursed Faction Avatar",
      "CURSED",
      "https://api.cursedfaction.com/avatars/"
    );

    const CursedGear = await ethers.getContractFactory("CursedGear1155");
    cursedGear = await CursedGear.deploy("https://api.cursedfaction.com/gear/");

    const ShadowArtifact = await ethers.getContractFactory("ShadowPowerArtifact");
    shadowArtifact = await ShadowArtifact.deploy(
      "Shadow Power Artifacts",
      "SHADOW",
      "https://api.cursedfaction.com/artifacts/"
    );

    // Enable minting
    await cursedAvatar.setMintingEnabled(true);
    await cursedGear.setMintingEnabled(true);
    await shadowArtifact.setMintingEnabled(true);

    // Set up gear contract
    await cursedGear.setCraftingStation(owner.address);
    await cursedGear.setSignerAddress(owner.address);
  });

  describe("CursedAvatar721 - Shadow Powers", function () {
    it("Should assign shadow powers based on seed and rarity", async function () {
      const seed1 = ethers.keccak256(ethers.toUtf8Bytes("test-seed-1"));
      const seed2 = ethers.keccak256(ethers.toUtf8Bytes("test-seed-2"));

      // Mint avatars
      await cursedAvatar.mint(user1.address, 0, seed1); // GRAVEMIND_SYNDICATE
      await cursedAvatar.mint(user2.address, 1, seed2); // HEX_ASSEMBLY

      // Get avatar details
      const avatar1Traits = await cursedAvatar.traits(0);
      const avatar2Traits = await cursedAvatar.traits(1);
      const avatar1Power = await cursedAvatar.getShadowPower(0);
      const avatar2Power = await cursedAvatar.getShadowPower(1);

      // Verify shadow powers were assigned
      expect(avatar1Power.power).to.not.equal(0); // Should not be NONE
      expect(avatar2Power.power).to.not.equal(0);

      // Verify charges are set correctly
      expect(avatar1Power.currentCharges).to.be.greaterThan(0);
      expect(avatar2Power.maxCharges).to.be.greaterThan(0);
    });

    it("Should allow shadow power usage and track charges", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed-3"));
      await cursedAvatar.mint(user1.address, 0, seed);

      const initialPower = await cursedAvatar.getShadowPower(0);
      const initialCharges = initialPower.currentCharges;

      // Use shadow power
      await cursedAvatar.connect(user1).useShadowPower(0);

      const updatedPower = await cursedAvatar.getShadowPower(0);
      expect(updatedPower.currentCharges).to.equal(initialCharges - 1);
    });

    it("Should prevent shadow power usage when no charges remain", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed-4"));
      await cursedAvatar.mint(user1.address, 0, seed);

      // Use all charges
      const power = await cursedAvatar.getShadowPower(0);
      for (let i = 0; i < power.currentCharges; i++) {
        await cursedAvatar.connect(user1).useShadowPower(0);
      }

      // Try to use power again
      await expect(
        cursedAvatar.connect(user1).useShadowPower(0)
      ).to.be.revertedWith("No shadow power charges");
    });

    it("Should allow shadow power recharging", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed-5"));
      await cursedAvatar.mint(user1.address, 0, seed);

      // Use some charges
      await cursedAvatar.connect(user1).useShadowPower(0);
      await cursedAvatar.connect(user1).useShadowPower(0);

      // Fast forward time (simulate time passing)
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
      await ethers.provider.send("evm_mine", []);

      // Recharge
      await cursedAvatar.connect(user1).rechargeShadowPower(0);

      const power = await cursedAvatar.getShadowPower(0);
      expect(power.currentCharges).to.be.greaterThan(0);
    });

    it("Should track shadow power counts by type", async function () {
      const seed1 = ethers.keccak256(ethers.toUtf8Bytes("test-seed-6"));
      const seed2 = ethers.keccak256(ethers.toUtf8Bytes("test-seed-7"));

      await cursedAvatar.mint(user1.address, 0, seed1);
      await cursedAvatar.mint(user2.address, 0, seed2);

      // Check that shadow power counts are tracked
      const power1 = await cursedAvatar.getShadowPower(0);
      const power2 = await cursedAvatar.getShadowPower(1);

      const count1 = await cursedAvatar.shadowPowerCounts(power1.power);
      const count2 = await cursedAvatar.shadowPowerCounts(power2.power);

      expect(count1).to.be.greaterThan(0);
      expect(count2).to.be.greaterThan(0);
    });
  });

  describe("ShadowPowerArtifact - Artifact System", function () {
    it("Should mint artifacts with correct properties", async function () {
      const artifactId = await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      const artifactData = await shadowArtifact.getArtifactData(0);
      expect(artifactData.artifactType).to.equal(0); // SHADOW_AMPLIFIER
      expect(artifactData.rarity).to.equal(2); // RARE
      expect(artifactData.powerLevel).to.equal(3);
      expect(artifactData.maxPowerLevel).to.equal(5);
      expect(artifactData.soulbound).to.be.false;
    });

    it("Should allow artifact equipping and soulbinding", async function () {
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact to avatar
      await shadowArtifact.connect(user1).equipArtifact(0, 123); // Avatar ID 123

      const equippedInfo = await shadowArtifact.getEquippedInfo(0);
      expect(equippedInfo.equippedBy).to.equal(user1.address);
      expect(equippedInfo.avatarId).to.equal(123);

      // Check power enhancement
      const enhancement = await shadowArtifact.getPowerEnhancement(0, 123);
      expect(enhancement).to.equal(3); // Initial power level
    });

    it("Should prevent transfer of soulbound artifacts", async function () {
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact (activates soulbinding)
      await shadowArtifact.connect(user1).equipArtifact(0, 123);

      // Try to transfer
      await expect(
        shadowArtifact.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("Soulbound artifact cannot be transferred");
    });

    it("Should allow power enhancement", async function () {
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact
      await shadowArtifact.connect(user1).equipArtifact(0, 123);

      // Enhance power
      await shadowArtifact.connect(user1).enhancePower(0, 123, 2);

      const enhancement = await shadowArtifact.getPowerEnhancement(0, 123);
      expect(enhancement).to.equal(5); // 3 + 2
    });

    it("Should prevent power enhancement beyond max level", async function () {
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact
      await shadowArtifact.connect(user1).equipArtifact(0, 123);

      // Try to enhance beyond max
      await expect(
        shadowArtifact.connect(user1).enhancePower(0, 123, 3)
      ).to.be.revertedWith("Exceeds maximum power level");
    });

    it("Should allow artifact unequipping", async function () {
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact
      await shadowArtifact.connect(user1).equipArtifact(0, 123);

      // Unequip artifact
      await shadowArtifact.connect(user1).unequipArtifact(0, 123);

      const enhancement = await shadowArtifact.getPowerEnhancement(0, 123);
      expect(enhancement).to.equal(0); // Should be removed
    });
  });

  describe("CursedGear1155 - Gear Evolution", function () {
    it("Should mint gear with correct properties", async function () {
      await cursedGear.mint(
        user1.address,
        1, // Gear ID
        5, // Amount
        0, // WEAPON_PISTOL
        2, // Tier 2
        4, // Max tier 4
        "shadow_steel", // Style modifier
        true // Evolvable
      );

      const gearData = await cursedGear.getGearData(1);
      expect(gearData.gearType).to.equal(0); // WEAPON_PISTOL
      expect(gearData.tier).to.equal(2);
      expect(gearData.maxTier).to.equal(4);
      expect(gearData.styleModifier).to.equal("shadow_steel");
      expect(gearData.evolvable).to.be.true;
    });

    it("Should allow gear evolution with signature", async function () {
      // Mint gear for evolution
      await cursedGear.mint(
        user1.address,
        1, // Gear ID
        3, // Amount (evolution cost)
        0, // WEAPON_PISTOL
        2, // Tier 2
        4, // Max tier 4
        "shadow_steel",
        true
      );

      // Create evolution signature
      const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256[]", "uint256[]", "uint256", "uint8", "address"],
        ["EVOLVE", [1, 1, 1], [1, 1, 1], 2, 3, user1.address]
      ));
      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      // Evolve gear
      await cursedGear.connect(user1).evolve(
        [1, 1, 1], // Gear IDs
        [1, 1, 1], // Amounts
        signature,
        2, // New gear ID
        3  // New tier
      );

      // Check evolution tier
      const evolutionTier = await cursedGear.getEvolutionTier(2);
      expect(evolutionTier).to.equal(3);
    });

    it("Should track evolution history", async function () {
      // Mint gear for evolution
      await cursedGear.mint(
        user1.address,
        1, // Gear ID
        3, // Amount
        0, // WEAPON_PISTOL
        2, // Tier 2
        4, // Max tier 4
        "shadow_steel",
        true
      );

      // Create evolution signature
      const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256[]", "uint256[]", "uint256", "uint8", "address"],
        ["EVOLVE", [1, 1, 1], [1, 1, 1], 2, 3, user1.address]
      ));
      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      // Evolve gear
      await cursedGear.connect(user1).evolve(
        [1, 1, 1], // Gear IDs
        [1, 1, 1], // Amounts
        signature,
        2, // New gear ID
        3  // New tier
      );

      // Check evolution history
      const history = await cursedGear.getEvolutionHistory(2);
      expect(history).to.include(1); // Should contain source gear ID
    });
  });

  describe("Integration Tests", function () {
    it("Should integrate avatar shadow powers with artifacts", async function () {
      // Mint avatar
      const seed = ethers.keccak256(ethers.toUtf8Bytes("integration-test"));
      await cursedAvatar.mint(user1.address, 0, seed);

      // Mint artifact
      await shadowArtifact.mint(
        user1.address,
        0, // SHADOW_AMPLIFIER
        2, // RARE
        3, // Power level 3
        5  // Max power level 5
      );

      // Equip artifact to avatar
      await shadowArtifact.connect(user1).equipArtifact(0, 0);

      // Check power enhancement
      const enhancement = await shadowArtifact.getPowerEnhancement(0, 0);
      expect(enhancement).to.equal(3);

      // Use shadow power
      await cursedAvatar.connect(user1).useShadowPower(0);

      // Verify integration works
      const power = await cursedAvatar.getShadowPower(0);
      expect(power.currentCharges).to.be.greaterThan(0);
    });

    it("Should handle complex shadow power scenarios", async function () {
      // Mint multiple avatars with different seeds
      const seeds = [
        ethers.keccak256(ethers.toUtf8Bytes("seed-1")),
        ethers.keccak256(ethers.toUtf8Bytes("seed-2")),
        ethers.keccak256(ethers.toUtf8Bytes("seed-3"))
      ];

      for (let i = 0; i < seeds.length; i++) {
        await cursedAvatar.mint(user1.address, i, seeds[i]);
      }

      // Check that different avatars get different shadow powers
      const power1 = await cursedAvatar.getShadowPower(0);
      const power2 = await cursedAvatar.getShadowPower(1);
      const power3 = await cursedAvatar.getShadowPower(2);

      // Powers should be different (though not guaranteed due to randomness)
      const powers = [power1.power, power2.power, power3.power];
      const uniquePowers = new Set(powers.map(p => p.toString()));
      
      // At least some variety should exist
      expect(uniquePowers.size).to.be.greaterThan(1);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owners to enable minting", async function () {
      await expect(
        cursedAvatar.connect(user1).setMintingEnabled(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owners to set base URI", async function () {
      await expect(
        cursedAvatar.connect(user1).setBaseURI("https://malicious.com/")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow token owners to use shadow powers", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("access-test"));
      await cursedAvatar.mint(user1.address, 0, seed);

      await expect(
        cursedAvatar.connect(user2).useShadowPower(0)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum supply limits", async function () {
      // This would take too long to test with 6666 mints
      // But we can test the logic
      const maxSupply = await cursedAvatar.MAX_SUPPLY();
      expect(maxSupply).to.equal(6666);
    });

    it("Should handle artifact power level limits", async function () {
      const maxPowerLevel = await shadowArtifact.MAX_POWER_LEVEL();
      expect(maxPowerLevel).to.equal(10);

      // Try to mint with power level > max
      await expect(
        shadowArtifact.mint(
          user1.address,
          0, // SHADOW_AMPLIFIER
          2, // RARE
          11, // Power level 11 (exceeds max)
          15  // Max power level 15
        )
      ).to.be.revertedWith("Power level too high");
    });

    it("Should handle zero address recipients", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("zero-address-test"));
      
      await expect(
        cursedAvatar.mint(ethers.ZeroAddress, 0, seed)
      ).to.be.revertedWith("Invalid recipient");
    });
  });
});