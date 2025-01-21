# USDC Transfer Monitor

A robust NestJS application that monitors and tracks large USDC transfers on the Ethereum blockchain in real-time. The application provides REST APIs for querying historical transfer data and WebSocket connections for real-time transfer notifications.

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
- Intelligent cache invalidation for real-time data consistency
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
4. Data is cached in Redis for quick access
5. REST APIs serve historical data with pagination

### Caching Strategy
- Sliding window cache for real-time data

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

