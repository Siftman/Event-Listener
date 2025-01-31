# USDC Large Transfer Monitor

Real-time monitoring of large USDC transfers on Ethereum mainnet. Tracks transfers over 100,000 USDC and displays them in a simple web interface.

## Quick Start
```bash
docker-compose up
```
Then open http://localhost:8080 in your browser. That's it!

## How it Works

The app listens to USDC transfer events on Ethereum mainnet using Web3. We track the last processed block to ensure we don't miss any transfers (stored in Redis). When a transfer event comes in, we filter out anything below 100k USDC to focus on whale movements.

The backend is built with NestJS and uses Socket.IO for real-time updates. When a large transfer is detected, it's broadcasted to all connected web clients. We also store these events in Postgres for persistence.

The frontend is a simple HTML page that connects to the WebSocket endpoint and displays transfers as they happen, newest first. Each transfer shows the block number, addresses involved, amount, and timestamp.

## Architecture Flow

api (NestJS) → listens to Ethereum events → filters large transfers → broadcasts via WebSocket → web client displays

Data persistence:
- Redis: Keeps track of the last processed block
- Postgres: Stores transfer events
- Nginx: Serves the static frontend

## Environment

The project uses environment variables for configuration. For Docker, these are set in `.env.docker`. The default setup includes:
- Ethereum node connection
- Database credentials
- USDC contract address

No setup needed as default values are ready to go in the Docker setup.

## Features

### Real-time Monitoring
- WebSocket-based real-time monitoring of USDC transfers
- Automatic event tracking with missed event recovery
- Real-time notifications for large transfers (>100,000 USDC)

### REST APIs
- `GET /api/latest-block`: Retrieve the latest processed block
- `GET /api/blocks`: Query historical blocks with pagination
- `GET /api/transfers`: Get historical transfers with filtering and pagination
- `GET /api/transfers/:blockNumber`: Fetch transfers for a specific block

### Performance Optimizations
- Pagination support for all list endpoints
- Rate limiting to prevent API abuse

### Data Validation & Security
- Input validation using DTOs and class-validator
- Comprehensive error handling with custom exceptions

## Technical Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Blockchain**: Web3.js
- **Testing**: Jest
- **WebSocket**: Socket.io
- **API Documentation**: Swagger/OpenAPI

## Architecture

### Core Services
- `BlockListenerService`: Monitors new blocks and maintains blockchain synchronization
- `USDCService`: Handles USDC transfer events and transaction processing
- `QueueService`: Manages Redis caching and event tracking
- `BlockchainController`: Exposes REST APIs for data access

### Data Flow
1. Block Listener monitors new Ethereum blocks
2. USDC transfers are detected and processed
3. Large transfers trigger WebSocket notifications
4. REST APIs serve historical data with pagination

### Error Handling
- Custom HTTP exception filter
- Rate limit error handling
- Blockchain node error recovery
- Automatic retry 

## Getting Started

### Prerequisites
```bash
- Node.js (v16+)
- PostgreSQL
- Redis
- Ethereum Node (WSS endpoint)
```

### Environment Variables
```env
ETHEREUM_RPC_URL=your_rpc_url
ETHEREUM_WS_URL=your_ws_url
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db
REDIS_URL=redis://localhost:6379
```

### Installation
```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start the application
npm run start:dev
```


## API Documentation

### Endpoints

#### Blocks
- `GET /api/latest-block`
  - Returns the latest processed block number
  - Rate limit

- `GET /api/blocks`
  - Returns paginated list of blocks
  - Query params: `page`, `limit`
  - Rate limit

#### Transfers
- `GET /api/transfers`
  - Returns paginated list of transfers
  - Query params: `page`, `limit`, `from`, `to`, `minValue`
  - Rate limit

- `GET /api/transfers/:blockNumber`
  - Returns transfers for specific block
  - Rate limit

### WebSocket Events
- `largeTransfer`: Emitted when a transfer exceeds 100,000 USDC
  ```typescript
  {
    blockNumber: number;
    from: string;
    to: string;
    value: string;
    timestamp: Date;
  }
  ```

## Performance Considerations
- Rate limiting to prevent API abuse
- Pagination for large datasets
- WebSocket for real-time updates instead of polling

