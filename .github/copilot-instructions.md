# Cursed Faction NFT Collection Backend

ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## CRITICAL: Known Build Issue

**⚠️ WORKSPACE COMPATIBILITY ISSUE**: The repository uses `workspace:*` syntax in service dependencies which is NOT supported by npm 10.8.2 or older versions. This causes npm install to fail with "Unsupported URL Type workspace:" error.

**CURRENT STATE**: Microservices workspace build is BROKEN. Only AI service and infrastructure work.

**WORKING COMPONENTS:**
- AI service: Full install and build works
- Infrastructure: Docker Compose starts successfully  
- Individual package builds: Work when dependencies are manually resolved

**BROKEN COMPONENTS:**  
- Root workspace install: Fails with both npm and pnpm
- Microservices build: Cannot resolve workspace dependencies
- Full stack development: Not currently possible

## Working Effectively

### Infrastructure Setup (ALWAYS works - 5 seconds)
- Start infrastructure services:
  ```bash
  docker compose up postgres redis nats otel-collector jaeger -d
  ```
- NEVER CANCEL: Infrastructure startup takes 5 seconds when images are cached, 2-3 minutes on first run for Docker pulls. Set timeout to 10+ minutes for first run.
- Check services are running:
  ```bash
  docker compose ps
  ```
- Validate PostgreSQL connection:
  ```bash
  docker compose exec postgres psql -U cursed -d cursed -c "SELECT 1;"
  ```

### AI Service (ALWAYS works)
- Navigate to AI service:
  ```bash
  cd ai
  ```
- Install dependencies (takes 6 seconds):
  ```bash
  npm install
  ```
- Build (takes 3 seconds):
  ```bash
  npm run build
  ```
- Create environment file:
  ```bash
  cp .env.example .env
  ```
- Required environment variables for AI service:
  - `RPC_URL` - Blockchain RPC endpoint
  - `VAULT_ADDRESS` - Contract address
  - `AI_EXECUTOR_PRIVATE_KEY` - Private key for transactions
  - `OPENAI_API_KEY` - Optional OpenAI API key
  - `CHAIN_ID` - Blockchain chain ID (defaults to Base Sepolia)

### Microservices (CURRENTLY BROKEN)
- **DO NOT attempt workspace builds** - they will fail
- **ISSUE**: `workspace:*` dependencies cannot be resolved by npm or pnpm
- **CANNOT** run `npm install` or `pnpm install` in root directory
- **CANNOT** build or run microservices until workspace issue is resolved
- **ERROR MESSAGE**: "Unsupported URL Type workspace:" or "@cursed/common not found"

### Alternative: Manual Service Setup (Advanced)
If you need to work on individual services:
1. Build common package dependencies manually in isolation
2. Copy built common package to service dependencies
3. Modify package.json to use file: instead of workspace: references
**WARNING**: This is complex and error-prone. Recommended to wait for workspace fix.

## Validation

### Infrastructure Validation
- ALWAYS verify infrastructure is running before testing services:
  ```bash
  docker compose ps
  ```
- Check PostgreSQL connection:
  ```bash
  docker compose exec postgres psql -U cursed -d cursed -c "SELECT 1;"
  ```

### AI Service Validation  
- Test build succeeds:
  ```bash
  cd ai && npm run build
  ```
- CANNOT run AI service without proper blockchain configuration
- CANNOT test AI functionality without RPC_URL and VAULT_ADDRESS set

### Full Stack Validation
- **NOT POSSIBLE** due to workspace compatibility issue  
- **CANNOT** start microservices stack: `docker compose up` fails during build
- **ONLY INFRASTRUCTURE** can be started: `docker compose up postgres redis nats -d`
- **ERROR**: Docker build fails at npm install step due to workspace: protocol

## Common Commands & Timing

### Repository Management
- `ls -la` - View repository root:
  ```
  .env.example          docker-compose.yml    packages/
  .github/              infra/                services/
  .gitignore           package.json          tsconfig.base.json
  ai/                  LICENSE               README.md
  contracts/           SECURITY.md           CursedFaction_GameDesignDocument (1).md
  ```

### Build Times (NEVER CANCEL)
- AI service install: 6 seconds (WORKS)
- AI service build: 3 seconds (WORKS)
- Infrastructure startup: 5 seconds cached, 2-3 minutes first time (WORKS)
- Infrastructure restart: <1 second (WORKS)
- Workspace install: FAILS immediately (BROKEN)
- Service builds: CANNOT TEST due to workspace issue (BROKEN)
- Full Docker build: FAILS at 3+ minutes during npm install (BROKEN)

### Docker Services
- PostgreSQL: `localhost:5432` (user: cursed, pass: cursed, db: cursed)
- Redis: `localhost:6379`
- NATS: `localhost:4222` (management: localhost:8222)
- Jaeger UI: `localhost:16686`
- OpenTelemetry: `localhost:4317` (gRPC), `localhost:4318` (HTTP)

## Architecture Overview

### Microservices (FastifyJS based)
- **api-gateway** (port 8080): Main API gateway
- **matchmaking** (port 4001): Player matchmaking service  
- **session** (port 4002): Session management
- **inventory** (port 4003): Player inventory management

### AI Operator
- Independent blockchain interaction service
- Uses viem for Web3 functionality  
- OpenAI integration for AI decisions
- Monitors smart contract events

### Smart Contracts
- Deployment scripts available in `contracts/scripts/`
- PiggyBank NFT contract
- Shadow Powers contracts
- **NOTE**: No Hardhat configuration visible in current state

### Infrastructure
- PostgreSQL for persistent data
- Redis for caching and queues  
- NATS for inter-service messaging
- OpenTelemetry for observability
- All containerized with Docker Compose

## Linting & Formatting

- NO linting configured: `npm run lint` outputs "no lint configured"
- NO formatting configured: `npm run format` outputs "no format configured"  
- TypeScript compilation available: `npm run typecheck`

## CRITICAL WARNINGS

- **NEVER attempt npm install or pnpm install in root** - will always fail
- **WORKSPACE BUILD IS BROKEN** - microservices cannot be built  
- **ONLY AI service and infrastructure work** in current state
- **NEVER CANCEL Docker operations** - they may take several minutes
- **CANNOT run full microservices stack** due to workspace compatibility issue
- **ALWAYS start infrastructure first** before attempting any development
- **Set timeouts of 10+ minutes** for Docker operations on first run

## Current Working State

✅ **What Works:**
- AI service: Complete install, build, and development workflow
- Infrastructure: All Docker services start and run correctly
- PostgreSQL/Redis/NATS: All accessible and functional

❌ **What's Broken:**  
- Root workspace: Cannot install dependencies
- Microservices: Cannot build due to workspace dependencies
- Full stack: Cannot run complete application
- Docker builds: Fail during npm install phase

## Quick Start Checklist

**For AI service development (WORKS):**
1. Start infrastructure: `docker compose up postgres redis nats -d` (5 seconds)
2. Navigate to AI: `cd ai` 
3. Install: `npm install` (6 seconds)
4. Build: `npm run build` (3 seconds)
5. Configure: Edit `.env` with blockchain settings

**For microservices (BROKEN):**
- DO NOT attempt until workspace issue is resolved
- All build commands will fail
- Focus on AI service development instead