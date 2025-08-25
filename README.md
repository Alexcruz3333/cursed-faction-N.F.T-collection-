# Cursed Faction NFT Vault System

A revolutionary NFT collection that acts like a crypto vault! Each NFT has its own vault where anyone can deposit funds, but only the current owner can withdraw. Perfect for savings goals, gifts,[...]

## ✨ What Makes It Special

- **🎁 Anyone Can Contribute**: Send ETH to any Cursed Faction NFT as a gift or tip
- **🔒 Owner-Only Withdrawals**: Only the current NFT owner can access the funds
- **🎯 Savings Goals**: Set targets and track progress visually
- **⏰ Time Locks**: Optional time-based restrictions for disciplined saving
- **🔄 Transferable Vaults**: When you sell/transfer the NFT, the vault balance goes with it
- **💎 ERC-721 Standard**: Fully compatible with all NFT marketplaces

## 🚀 Quick Start

### Smart Contract Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Hardhat** (update `hardhat.config.ts` with your network settings)

3. **Deploy the contract**:
   ```bash
   npx hardhat run scripts/deploy-cursed-faction-vault.ts --network base-mainnet
   ```

4. **Run tests**:
   ```bash
   npx hardhat test
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Update `CONTRACT_ADDRESS` in `app/page.tsx` with your deployed contract
   - Get a WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)
   - Update `projectId` in `app/layout.tsx`

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Smart Contract (`CursedFactionVaultNFT.sol`)

- **ERC-721 NFT**: Each token represents a unique vault
- **Vault System**: Separate ETH and ERC-20 balances per token
- **Access Control**: Only token owners can withdraw or modify settings
- **Time Locks**: Configurable unlock dates for disciplined saving
- **Savings Goals**: Track progress toward financial targets

### Frontend Features

- **Wallet Connection**: RainbowKit integration for seamless wallet support
- **Real-time Updates**: Live balance and progress tracking
- **Responsive Design**: Beautiful UI that works on all devices
- **Transaction Management**: Easy deposit, withdrawal, and goal setting

## 🔧 Key Functions

### For Contributors (Anyone)

- `depositETH(tokenId)`: Send ETH to any Cursed Faction NFT vault
- `depositERC20(tokenId, token, amount)`: Send ERC-20 tokens

### For Owners

- `withdrawETH(tokenId, amount)`: Withdraw ETH from your NFT vault
- `withdrawERC20(tokenId, token, amount)`: Withdraw ERC-20 tokens
- `setSavingsGoal(tokenId, goalWei)`: Set or update savings target
- `extendUnlock(tokenId, newUnlockTime)`: Extend time lock (never shorten)

## 🎨 Use Cases

- **Personal Savings**: Set goals and lock funds until target date
- **Gift Giving**: Friends and family can contribute to your savings
- **Crowdfunding**: Collaborative funding for projects or causes
- **Prize Pools**: Accumulate rewards that transfer with ownership
- **Tipping System**: Content creators can receive tips via NFT

## 🔒 Security Features

- **Reentrancy Protection**: Guards against withdrawal attacks
- **Ownership Verification**: Only current token owners can access funds
- **Time Lock Safety**: Locks can only be extended, never shortened
- **Checks-Effects-Interactions**: Secure withdrawal pattern

## 🌐 Deployment

### Recommended Networks

- **Base Mainnet**: Low fees, high security, Coinbase backing
- **Polygon**: Fast transactions, low costs
- **Arbitrum One**: High throughput, low fees

### Deployment Checklist

- [ ] Verify contract on block explorer
- [ ] Set appropriate `baseURI` for metadata
- [ ] Mint initial NFTs for testing
- [ ] Update frontend contract address
- [ ] Test all functions on testnet first

## 📱 Frontend Features

- **Wallet Integration**: Support for MetaMask, WalletConnect, and more
- **Real-time Data**: Live balance updates and transaction status
- **Mobile Responsive**: Optimized for all device sizes
- **Beautiful UI**: Modern design with intuitive user experience
- **Transaction History**: Track all deposits and withdrawals

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/CursedFactionVaultNFT.test.ts

# Run with coverage
npx hardhat coverage
```

## 📚 Documentation

- [Smart Contract API](./docs/smart-contract-api.md)
- [Frontend Development](./docs/frontend-guide.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Considerations](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. The developers are not responsible for any financial losses. Always test thoroughly on testnets before using real funds.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)

---

**Built with ❤️ using Hardhat, Next.js, and OpenZeppelin**