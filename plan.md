# Educational Crypto Trading Simulator - Plan

## 1. Validated project baseline

- The repository is currently a clean starting point.
- The frontend will use raw React.
- The backend will use Express with MongoDB.
- The product is educational only and must never support real-money financial activity.

## 2. Chosen stack

- Frontend: React
- Backend: Express
- Database: MongoDB
- Real-time layer: Socket.io

## 3. Product boundaries

### Included MVP

1. Authentication and protected routes.
2. Virtual BDT wallet seeded with 100,000 BDT.
3. Simulated crypto market for BTC, ETH, SOL, DOGE, XRP, and BNB.
4. Market buy and sell trading.
5. Portfolio valuation and transaction history.
6. Prediction challenges using virtual points.
7. Leaderboard, achievements, and learning pages.

### Explicit exclusions

- Real cryptocurrency wallets.
- Real-money deposits or withdrawals.
- Exchange order execution.
- Futures, leverage, margin, and shorting.
- Betting or prize payouts.

### Required disclaimer

Use a persistent disclaimer stating:

> Educational simulator only. All balances, trades, prices, and rewards are virtual; no real cryptocurrency or financial transaction occurs.

## 4. Architecture

### Frontend

- React
- React Router
- State management for auth, wallet, portfolio, and UI state
- HTTP client for API calls
- Socket client for live price updates

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT authentication
- Password hashing
- Scheduled jobs for market data refresh, ticks, and settlement
- Market-data adapter so the provider can be changed later

## 5. Data model

Use schema validation, timestamps, and indexes for lookups.

| Collection | Key fields |
| --- | --- |
| users | name, email, passwordHash, role, difficulty, status |
| wallets | userId, cashBalanceBDT, virtualPoints, portfolioValueBDT |
| portfolioHoldings | userId, symbol, quantity, averageBuyPriceBDT, realizedPnlBDT |
| transactions | userId, symbol, side, quantity, executionPriceBDT, feeBDT, createdAt |
| orders | userId, symbol, type, side, quantity, limitPriceBDT, status, filledAt |
| priceHistory | symbol, provider, interval, timestamp, open, high, low, close, volume |
| simulatedPriceTicks | sessionId, symbol, priceBDT, sourceWindow, seed, generatedAt |
| simulationSessions | userId or global scope, difficulty, seed, sourceWindow, status, startedAt |
| predictionChallenges | symbol, direction, pointsStaked, startPriceBDT, endPriceBDT, closesAt, result |
| achievements | userId, code, unlockedAt |
| notifications | userId, type, message, readAt |

## 6. API and real-time contract

### REST endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/users/me

GET    /api/wallet
GET    /api/coins
GET    /api/coins/:symbol
GET    /api/coins/:symbol/history

POST   /api/trades/buy
POST   /api/trades/sell
POST   /api/orders
GET    /api/orders
PATCH  /api/orders/:id/cancel
GET    /api/portfolio
GET    /api/transactions

POST   /api/predictions
GET    /api/predictions/history
GET    /api/leaderboard
GET    /api/achievements
GET    /api/learning

GET    /api/admin/users
PATCH  /api/admin/users/:id/status
PATCH  /api/admin/simulation
```

### Socket.io events

```text
server -> client: market:prices
server -> client: market:tick
server -> client: portfolio:updated
server -> client: notification:new
client -> server: market:subscribe
client -> server: market:unsubscribe
```

REST remains the source of truth for trades and predictions.

## 7. Repository layout

```text
client/
  src/{components,pages,layouts,features,services,hooks,lib,assets}
server/
  src/{config,controllers,models,routes,middlewares,services,socket,jobs,utils}
  tests/
docs/
```

The client and server should stay independently deployable with separate package manifests.

## 8. Delivery phases

### Phase 0 - Foundation

- Initialize the React client and Express server.
- Configure linting, formatting, environment validation, and health checks.
- Define the API error envelope and shared constants.

### Phase 1 - Identity and wallet

- Implement registration, login, authorization middleware, and profile endpoints.
- Create a wallet on registration with 100,000 virtual BDT and zero holdings.
- Build login, registration, dashboard shell, and disclaimer components.

### Phase 2 - Historical market data

- Implement the market-data adapter and scheduled retrieval.
- Persist normalized candles and expose market history endpoints.

### Phase 3 - Simulation engine and live UI

- Implement deterministic simulated prices and difficulty profiles.
- Broadcast server-authoritative prices through Socket.io.
- Build responsive market cards and charts.

### Phase 4 - Trading and portfolio

- Implement market buy and sell flows with validation and MongoDB transactions.
- Add portfolio P/L, allocation chart, transaction history, and order management.

### Phase 5 - Learning, predictions, and gamification

- Add learning content and quizzes.
- Add time-boxed prediction challenges using virtual points.
- Add leaderboard and initial achievements.

### Phase 6 - Administration, quality, and security

- Add role-based admin routes and simulation controls.
- Add validation, rate limiting, security headers, CORS, and audit logs.
- Add unit, integration, and end-to-end tests for critical flows.

### Phase 7 - Deployment

- Deploy the MongoDB database.
- Deploy the Express API.
- Deploy the React frontend.
- Configure CORS, health checks, and staging smoke tests.

## 9. Environment variables

### Server

```text
NODE_ENV=production
PORT=10000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_ORIGIN=
MARKET_DATA_PROVIDER=
MARKET_DATA_API_KEY=
PRICE_TICK_INTERVAL_MS=3000
HISTORICAL_REFRESH_CRON=
```

### Client

```text
VITE_API_BASE_URL=
VITE_SOCKET_URL=
```

## 10. Key risks

| Risk | Mitigation |
| --- | --- |
| Provider outage or rate limit | Cache historical candles and keep the last validated data available. |
| Inconsistent price execution | Use server-authoritative simulated prices for all trades. |
| Race conditions in wallet updates | Use MongoDB transactions and atomic updates. |
| Socket scaling issues | Start with a single instance and add shared pub/sub later if needed. |
| Regulatory ambiguity | Keep all values virtual and show the educational-only disclaimer. |

## 11. Open decisions

1. Choose the UI library, if any, for the React frontend.
2. Confirm the historical-data provider and conversion strategy.
3. Decide trade fees, minimum order size, and whether limit orders are in MVP.
4. Confirm whether the market simulation is global or per-user.
5. Confirm whether admin features ship in the first public release.
