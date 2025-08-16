# Cursed Faction — Open-World PvP MMO

A fast, gritty, supernatural open-world MMO set in a neo-occult metropolis where rival Factions battle for territory, resources, and prestige.

## 🎮 Core Concept

- **Open-World Chaos:** Dense, GTA-like sandbox with vehicles, pursuits, and emergent events
- **Skillful PvP:** Shooter-melee hybrid with abilities and team tactics
- **Faction Metagame:** Territory control, seasonal map shifts, faction tech trees
- **Ethical Web3:** NFT integration without power creep, balanced progression

## 🏗️ Project Structure

```
cursed-faction/
├── contracts/           # Smart contract suite (ERC-721, ERC-1155, etc.)
├── game/               # Unreal Engine 5 project files
├── services/           # Backend microservices
├── web/                # Web3 frontend and marketplace
├── docs/               # Technical documentation
├── tools/              # Development and deployment tools
└── tests/              # Contract and service tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Solidity 0.8.19+
- Unreal Engine 5.3+
- Docker & Docker Compose

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd cursed-faction

# Install dependencies
npm install

# Start local development environment
docker-compose up -d

# Deploy contracts to local network
npm run deploy:local

# Start game development server
cd game && ue5
```

## 🎯 MVP Scope

**Target:** 12-15 months to Closed Alpha

**Content:**
- 1 Hub + Ashen Ward district (2.5-3 km² playable)
- 32-player shards with basic AI
- 10 weapons, 20 armor sets, 12 abilities, 8 vehicles
- Free-Roam + Heist + Ranked + Bounty systems
- Web3: Avatar import, style skins, rentals, custodial wallet

## 🔗 Links

- [Game Design Document](./docs/game-design.md)
- [Technical Architecture](./docs/architecture.md)
- [Smart Contract Documentation](./docs/contracts.md)
- [API Documentation](./docs/api.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
