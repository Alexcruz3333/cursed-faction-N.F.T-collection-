# 🚀 PiggyBank NFT Deployment Guide

This guide will walk you through deploying the PiggyBank NFT smart contract and setting up the frontend.

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or another Web3 wallet
- Test ETH for gas fees (Base Sepolia testnet recommended first)
- Hardhat development environment

## 🔧 Environment Setup

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install Hardhat globally (if not already installed)
npm install -g hardhat
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Your private key (keep this secret!)
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# API Keys (optional, for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

### 3. Update Hardhat Configuration

Edit `hardhat.config.ts` to include your network configurations:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Base Sepolia Testnet (recommended for testing)
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    // Base Mainnet
    "base-mainnet": {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "base-mainnet": process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};

export default config;
```

## 🚀 Smart Contract Deployment

### 1. Compile Contracts

```bash
# Compile all contracts
npx hardhat compile
```

### 2. Deploy to Testnet (Recommended First)

```bash
# Deploy to Base Sepolia testnet
npx hardhat run scripts/deploy-piggy-bank.ts --network base-sepolia
```

This will:
- Deploy the PiggyBankNFT contract
- Mint 2 example NFTs with different configurations
- Display the deployed contract address

**Save the contract address!** You'll need it for the frontend.

### 3. Verify Contract on Block Explorer

```bash
# Verify on Basescan
npx hardhat verify --network base-sepolia DEPLOYED_CONTRACT_ADDRESS "https://api.piggybanknft.com/metadata/"
```

### 4. Test the Contract

```bash
# Run the test suite
npx hardhat test

# Run specific test file
npx hardhat test test/PiggyBankNFT.test.ts
```

### 5. Deploy to Mainnet

Once you're satisfied with the testnet deployment:

```bash
# Deploy to Base mainnet
npx hardhat run scripts/deploy-piggy-bank.ts --network base-mainnet

# Verify on mainnet
npx hardhat verify --network base-mainnet DEPLOYED_CONTRACT_ADDRESS "https://api.piggybanknft.com/metadata/"
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Contract Address

Update `app/page.tsx` with your deployed contract address:

```typescript
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
```

### 4. Get WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project
3. Copy the Project ID
4. Update `app/layout.tsx`:

```typescript
const { wallets } = getDefaultWallets({
  appName: 'PiggyBank NFT',
  projectId: 'YOUR_ACTUAL_PROJECT_ID_HERE', // Replace this
  chains: [base, baseGoerli],
});
```

### 5. Start Development Server

```bash
npm run dev
```

Your frontend should now be running at `http://localhost:3000`

## 🔍 Post-Deployment Verification

### 1. Test Basic Functions

- [ ] Connect wallet
- [ ] View NFT balances
- [ ] Deposit ETH to an NFT
- [ ] Set savings goals
- [ ] Withdraw funds (if you own the NFT)

### 2. Check Contract on Block Explorer

- [ ] Verify contract source code
- [ ] Check transaction history
- [ ] Verify event emissions
- [ ] Test contract functions

### 3. Test User Experience

- [ ] Test on different devices
- [ ] Verify mobile responsiveness
- [ ] Check wallet compatibility
- [ ] Test error handling

## 🌐 Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

### 2. Deploy to Hosting Service

Choose your preferred hosting service:

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Traditional Hosting:**
Upload the `out` folder to your web server.

### 3. Update DNS and Environment

- [ ] Point domain to hosting service
- [ ] Update environment variables
- [ ] Test production deployment
- [ ] Monitor for errors

## 🔒 Security Checklist

- [ ] Contract verified on block explorer
- [ ] Private keys secured and not committed to repo
- [ ] Environment variables properly configured
- [ ] Frontend contract address updated
- [ ] WalletConnect project ID configured
- [ ] Testnet deployment tested thoroughly
- [ ] Gas limits and transaction parameters verified
- [ ] Access control functions tested
- [ ] Emergency pause functionality tested (if applicable)

## 📊 Monitoring and Maintenance

### 1. Monitor Contract Activity

- Track deposits and withdrawals
- Monitor gas usage
- Check for unusual activity
- Monitor balance changes

### 2. Regular Updates

- Keep dependencies updated
- Monitor for security patches
- Update frontend as needed
- Backup important data

### 3. User Support

- Monitor user feedback
- Address common issues
- Provide documentation
- Maintain community engagement

## 🆘 Troubleshooting

### Common Issues

**Contract Deployment Fails:**
- Check private key configuration
- Verify network RPC URL
- Ensure sufficient gas funds
- Check network connectivity

**Frontend Connection Issues:**
- Verify contract address
- Check WalletConnect configuration
- Ensure correct network selection
- Check browser console for errors

**Transaction Failures:**
- Verify gas limits
- Check user balance
- Ensure correct function parameters
- Verify user permissions

### Getting Help

- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review [GitHub Discussions](https://github.com/your-repo/discussions)
- Consult the [Project Wiki](https://github.com/your-repo/wiki)
- Join community channels

## 🎉 Congratulations!

You've successfully deployed the PiggyBank NFT! 

**Next Steps:**
1. Share your deployed contract address
2. Invite users to test the system
3. Gather feedback and iterate
4. Consider additional features
5. Build your community

---

**Remember:** Always test thoroughly on testnets before mainnet deployment, and never share your private keys!
