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

These functions allow **anyone** to contribute to any Cursed Faction NFT Vault, making them perfect for gifts, tips, and collaborative funding:

- **`depositETH(tokenId)`**: Send ETH directly to any Cursed Faction NFT Vault
  - `tokenId`: The ID of the NFT you want to contribute to
  - *Example*: Send 0.1 ETH to NFT #5 as a birthday gift
  - *Gas Cost*: ~21,000-30,000 gas

- **`depositERC20(tokenId, token, amount)`**: Send ERC-20 tokens to any Cursed Faction NFT Vault
  - `tokenId`: The ID of the target NFT
  - `token`: Contract address of the ERC-20 token (e.g., USDC, USDT)
  - `amount`: Amount in token's base units (consider decimals)
  - *Example*: Send 100 USDC to help someone reach their savings goal
  - *Note*: Requires prior token approval

### For Owners

These functions are **restricted to the current NFT owner** and provide complete control over funds and settings:

#### 💰 Fund Management
- **`withdrawETH(tokenId, amount)`**: Withdraw ETH from your NFT vault
  - `tokenId`: Your NFT ID
  - `amount`: Amount in wei (use ethers.parseEther for ETH amounts)
  - *Restrictions*: Must respect time locks if set
  - *Example*: Withdraw 0.5 ETH from your savings NFT

- **`withdrawERC20(tokenId, token, amount)`**: Withdraw ERC-20 tokens from your NFT
  - `tokenId`: Your NFT ID
  - `token`: Contract address of the token to withdraw
  - `amount`: Amount in token's base units
  - *Security*: Only withdraws tokens you actually own

#### ⚙️ Settings & Configuration
- **`setSavingsGoal(tokenId, goalWei)`**: Set or update your savings target
  - `tokenId`: Your NFT ID
  - `goalWei`: Target amount in wei (0 to disable goal tracking)
  - *UI Benefit*: Enables progress tracking and visual indicators
  - *Example*: Set a goal of 5 ETH for a vacation fund

- **`extendUnlock(tokenId, newUnlockTime)`**: Extend time lock for disciplined saving
  - `tokenId`: Your NFT ID
  - `newUnlockTime`: Unix timestamp of new unlock date
  - *Security*: Can only extend, never shorten lock periods
  - *Use Case*: Commit to saving for longer periods

#### 🔐 Advanced Features
- **`approveETHSpender(tokenId, spender, amount)`**: Allow another address to spend ETH from your NFT
  - Enables advanced DeFi integrations and automated spending
  - Perfect for recurring payments or DeFi strategies

- **`spendETH(tokenId, to, amount)`**: Send ETH from your NFT to any address
  - Alternative to withdraw → manual send
  - Gas efficient for direct payments

### 💡 Code Examples

**Contributing ETH to someone's NFT:**
```javascript
// Send 0.1 ETH to NFT #42
await cursedFactionVaultContract.depositETH(42, { 
  value: ethers.parseEther("0.1") 
});
```

**Setting a savings goal (owners only):**
```javascript
// Set goal of 5 ETH for NFT #1
const goalInWei = ethers.parseEther("5.0");
await cursedFactionVaultContract.setSavingsGoal(1, goalInWei);
```

**Withdrawing with time lock check:**
```javascript
// Withdraw 1 ETH if time lock allows
const amount = ethers.parseEther("1.0");
await cursedFactionVaultContract.withdrawETH(1, amount);
```

## 🎨 Use Cases

- **💰 Personal Savings**: Set savings goals with time locks to build discipline
  - *Example*: Lock funds for 6 months to save for a vacation
  - *Benefit*: Visual progress tracking keeps you motivated

- **🎁 Gift Giving**: Friends and family can contribute to your savings goals
  - *Example*: Wedding fund where guests can contribute via your NFT
  - *Benefit*: All gifts automatically tracked and secured

- **🚀 Crowdfunding**: Collaborative funding for projects or causes
  - *Example*: Community pool for local charity or startup funding
  - *Benefit*: Transparent, immutable contribution tracking

- **🏆 Prize Pools**: Accumulate rewards that transfer with ownership
  - *Example*: Gaming tournament prizes that stay with the winning NFT
  - *Benefit*: Value transfers when NFT is sold or traded

- **💡 Tipping System**: Content creators can receive tips via their NFT
  - *Example*: YouTuber shares NFT address for fan donations
  - *Benefit*: All tips accumulate in one secure, transferable vault

- **🏢 Business Treasury**: Company funds managed through transferable NFTs
  - *Example*: Department budgets that can be reassigned by transferring NFTs
  - *Benefit*: Clear ownership and spending controls

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