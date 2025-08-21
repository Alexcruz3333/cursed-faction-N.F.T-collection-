# Cursed Faction Backend (MVP)

Monorepo for MMO backend services: API Gateway, Matchmaking, Session, Inventory.

## Recent Improvements

This codebase has been enhanced with the following improvements:

### Code Quality
- ✅ **ESLint & Prettier**: Added linting and formatting configuration
- ✅ **Input Validation**: Zod schemas for all API endpoints
- ✅ **Error Handling**: Comprehensive try-catch blocks with structured error responses
- ✅ **TypeScript**: Improved type safety across all services

### Security & Reliability
- ✅ **Rate Limiting**: Added rate limiting middleware to API gateway
- ✅ **CORS Configuration**: Environment-specific CORS settings
- ✅ **Graceful Shutdown**: Proper cleanup when services stop
- ✅ **Race Condition Fixes**: Atomic operations in matchmaking service
- ✅ **Connection Pooling**: Improved PostgreSQL, Redis, and NATS configurations

### Service Architecture
- ✅ **Environment Validation**: Zod validation for all environment variables
- ✅ **Structured Logging**: Enhanced logging with context and error tracking
- ✅ **Connection Management**: Better error handling and reconnection logic

## Quickstart

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Start the Full Stack
```bash
docker compose up --build
```

### Development Commands
```bash
# Install dependencies (if running locally)
npm install

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Development mode for individual services
npm run dev:gateway
npm run dev:matchmaking
npm run dev:session
npm run dev:inventory
```

## Services

- **API Gateway**: http://localhost:8080/healthz
  - Player management and matchmaking endpoints
  - Rate limiting and input validation
  - CORS configuration

- **Matchmaking Service**: Handles player queuing and match creation
  - MMR-based bucketing
  - Race condition protection
  - Team balancing (4v4 matches)

- **Session Service**: Manages game sessions
  - Session creation from matches
  - Session retrieval with validation

- **Inventory Service**: Player inventory management
  - Item quantity management
  - Player validation

## Monitoring

- **Jaeger UI**: http://localhost:16686 (Distributed tracing)
- **NATS Monitoring**: http://localhost:8222 (Message bus)

## Environment Variables

Services read from environment variables. For local development, copy `.env.example` or set:

- `POSTGRES_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `NATS_URL` - NATS server URL
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OpenTelemetry endpoint
- `NODE_ENV` - Environment (development/production)

## API Endpoints

### API Gateway (Port 8080)

#### Get Player
```http
GET /v1/players/{id}
```
Returns player information including account level, MMR, and wallet address.

#### Enqueue for Matchmaking
```http
POST /v1/matchmaking/enqueue
Content-Type: application/json

{
  "playerId": "uuid",
  "mmr": 1000  // optional, defaults to 1000
}
```

### Session Service (Port 4002)

#### Get Session
```http
GET /v1/sessions/{id}
```
Returns session details including teams and game mode.

### Inventory Service (Port 4003)

#### Get Player Inventory
```http
GET /v1/inventory/{playerId}
```

#### Update Inventory Item
```http
POST /v1/inventory/{playerId}
Content-Type: application/json

{
  "itemId": "weapon_ak47",
  "qty": 5
}
```

## Database Schema

The system uses PostgreSQL with the following main tables:
- `players` - Player accounts and MMR
- `avatars` - NFT avatar data
- `inventory` - Player item quantities
- `loadouts` - Player equipment configurations
- `matches` - Game match results

## Architecture Notes

- **Microservices**: Each service is independently deployable
- **Message Bus**: NATS for async communication between services
- **Observability**: OpenTelemetry tracing throughout the stack
- **Validation**: Zod schemas ensure data integrity
- **Security**: Rate limiting, CORS, input validation
- **Scalability**: Connection pooling and atomic operations
