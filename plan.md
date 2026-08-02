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
| orders (post-MVP, not built in v1) | userId, symbol, type, side, quantity, limitPriceBDT, status, filledAt |
| priceHistory | symbol, provider, interval, timestamp, open, high, low, close, volume |
| simulatedPriceTicks | sessionId, symbol, priceBDT, sourceWindow, seed, generatedAt |
| simulationSessions | userId (per-user, always scoped — see [Resolved decisions](#11-resolved-decisions)), difficulty, seed, sourceWindow, status, startedAt |
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

Limit-order endpoints (`POST /api/orders`, `GET /api/orders`, `PATCH /api/orders/:id/cancel`) and the `orders` collection are dropped from MVP scope — see [Resolved decisions](#11-resolved-decisions). MVP trades execute as market orders only, immediately against the acting user's current simulated price.

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

Delivery workflow: implement exactly one sub-phase at a time, then stop for a manual commit before starting the next. Baseline status of Phase 0 (confirmed in the current repo): `client/` is a Vite + React 19 scaffold with React Router, axios, and socket.io-client already installed and oxlint configured; `server/` already has `src/app.js` (helmet, cors, morgan, cookie-parser, rate-limit, `/api/health`, 404 + error middleware), `src/index.js` (http server + Socket.io with `market:subscribe`/`market:unsubscribe`), `src/config/env.js` (zod-validated env), and `src/config/db.js` (mongoose connect), with bcryptjs/jsonwebtoken/mongoose/socket.io/zod already installed. What's still missing from Phase 0's scope — the shared API error envelope/constants module and server-side lint config — is closed out by Phase 0.1 below.

### Phase 0 - Foundation

#### Phase 0.1 - Foundation completion

1. `server/src/constants/index.js`: `SUPPORTED_SYMBOLS` (BTC, ETH, SOL, DOGE, XRP, BNB), `STARTING_BALANCE_BDT` (100000), `DISCLAIMER_TEXT`, error code enum.
2. `server/src/utils/AppError.js` (status + code + message) and an `asyncHandler` wrapper; rewire `app.js`'s error middleware to emit a consistent `{ error: { code, message, details } }` envelope.
3. Server lint config: add `oxlint` devDependency + `.oxlintrc.json` + `lint` script, mirroring `client/.oxlintrc.json`.
4. `client/src/lib/constants.js` mirroring `SUPPORTED_SYMBOLS` and the disclaimer text for reuse across pages.

### Phase 1 - Identity and wallet

#### Phase 1.1 - User & Wallet models

`server/src/models/User.js` (name, email unique index, passwordHash, role enum, difficulty, status, timestamps) and `server/src/models/Wallet.js` (userId indexed, cashBalanceBDT default 100000, virtualPoints, portfolioValueBDT, timestamps).

#### Phase 1.2 - Auth core

`server/src/utils/jwt.js` (sign/verify), `server/src/middlewares/auth.js` (`requireAuth` reading JWT from an httpOnly cookie), `server/src/services/authService.js` (register creates a User + Wallet together, login verifies the bcrypt hash).

#### Phase 1.3 - Auth routes

`POST /api/auth/register`, `POST /api/auth/login` (sets httpOnly JWT cookie), `GET /api/auth/me`, `PATCH /api/users/me`, `GET /api/wallet` — controllers plus `authRoutes.js`, `userRoutes.js`, `walletRoutes.js`, wired into `app.js`.

#### Phase 1.4 - Frontend app shell

React Router setup in `App.jsx`, `client/src/services/httpClient.js` (axios instance, `withCredentials: true`), `client/src/features/auth/AuthContext.jsx` (login/register/logout/me + loading state), a `ProtectedRoute` component, and a root layout with the persistent disclaimer banner (using Phase 0.1 constants).

#### Phase 1.5 - Auth pages

Login page, Register page, Dashboard shell page (shows wallet balance from `GET /api/wallet`) — replaces the default Vite template content.

### Phase 2 - Historical market data

#### Phase 2.1 - Model and adapter interface

`server/src/models/PriceHistory.js` (symbol, provider, interval, timestamp, OHLCV, indexed on symbol+interval+timestamp) and `server/src/services/marketData/adapter.js` (provider-agnostic interface: `fetchHistory(symbol, interval, range)`).

#### Phase 2.2 - CoinGecko provider, refresh job, seed script

`server/src/services/marketData/coinGeckoProvider.js` implementing the adapter against CoinGecko's free endpoints and normalizing responses into the `PriceHistory` shape; `server/src/jobs/historicalRefreshJob.js` (cron via `HISTORICAL_REFRESH_CRON`); a one-off `npm run seed:history` script to backfill initial candles for the 6 symbols on a fresh DB.

#### Phase 2.3 - Coins REST endpoints

`GET /api/coins` (latest snapshot per symbol), `GET /api/coins/:symbol`, `GET /api/coins/:symbol/history` — controllers plus `coinRoutes.js`.

#### Phase 2.4 - Frontend Market page

`client/src/services/coinsService.js` plus a Market page listing the 6 coins with latest price/24h change (plain fetch, no live updates yet).

### Phase 3 - Simulation engine and live UI

#### Phase 3.1 - Simulation models and engine

`server/src/models/SimulationSession.js` (userId, seed, difficulty, sourceWindow, status, startedAt) and `server/src/models/SimulatedPriceTick.js` (sessionId, symbol, priceBDT, generatedAt); `server/src/services/simulation/engine.js`: seeded-RNG deterministic walk with difficulty presets (volatility/drift), anchored to each symbol's latest `PriceHistory` close.

#### Phase 3.2 - Session bootstrap and tick job

Hook a `simulationSession` into registration (small addition to the Phase 1 register flow — auto-created per user, advanced continuously regardless of whether they're online) and add `server/src/jobs/simulationTickJob.js`: on `PRICE_TICK_INTERVAL_MS`, advances every active user's session for all 6 symbols and persists ticks.

#### Phase 3.3 - Live Socket.io events

Authenticate the socket handshake (JWT from cookie), scope rooms per user, and emit `market:prices` (snapshot on subscribe) and `market:tick` (per interval) from the tick job.

#### Phase 3.4 - Frontend live market cards

`client/src/services/socketClient.js` and a `useMarketPrices` hook; live-updating market cards (flash on price change) replacing Phase 2's static cards.

#### Phase 3.5 - Frontend price chart

A lightweight SVG/canvas line chart combining historical candles with live ticks, on a coin detail page.

### Phase 4 - Trading and portfolio

#### Phase 4.1 - Trade models and service

`server/src/models/PortfolioHolding.js` (userId, symbol, quantity, averageBuyPriceBDT, realizedPnlBDT) and `server/src/models/Transaction.js` (userId, symbol, side, quantity, executionPriceBDT, feeBDT, createdAt); `server/src/services/tradeService.js`: atomic buy/sell using a MongoDB session/transaction against the user's latest simulated price, updating wallet cash and holdings (average-cost basis) together.

#### Phase 4.2 - Trade and portfolio endpoints

`POST /api/trades/buy`, `POST /api/trades/sell` (balance/quantity validation), `GET /api/portfolio` (holdings + live valuation), `GET /api/transactions` (paginated) — `tradeRoutes.js`.

#### Phase 4.3 - Frontend trade panel

Buy/sell form with live price, quantity, and estimated cost, on the coin detail page.

#### Phase 4.4 - Frontend portfolio page

Holdings table with per-holding P/L, a simple allocation chart, and a transaction history table.

### Phase 5 - Learning, predictions, and gamification

#### Phase 5.1 - Predictions

`server/src/models/PredictionChallenge.js` (symbol, direction, pointsStaked, startPriceBDT, endPriceBDT, closesAt, result), `POST /api/predictions`, `server/src/jobs/predictionSettlementJob.js` (resolves at `closesAt` against the user's own simulated price), and `GET /api/predictions/history`.

#### Phase 5.2 - Achievements and leaderboard

`server/src/models/Achievement.js` plus unlock-rule evaluation hooked into trade/prediction/wallet events, `GET /api/achievements`; leaderboard aggregation ranked by portfolio return % (fair even though each user has their own simulated price path) and `GET /api/leaderboard`.

#### Phase 5.3 - Learning content

Static learning content module and `GET /api/learning`.

#### Phase 5.4 - Frontend gamification pages

Predictions page, Leaderboard page, Achievements page, Learning page.

### Phase 6 - Administration, quality, and security

#### Phase 6.1 - Admin routes

`requireRole('admin')` middleware plus `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `PATCH /api/admin/simulation` — `adminRoutes.js`.

#### Phase 6.2 - Validation, rate limits, audit log

Zod request-validation schemas on all mutating routes, tighter per-route rate limits (auth, trades), a `Notification` model, and audit-log writes for admin actions.

#### Phase 6.3 - Automated tests

Unit tests for `tradeService`/simulation engine, integration tests for auth/trade/prediction routes using `mongodb-memory-server`, and one end-to-end critical-path test (register -> trade -> portfolio -> predict -> leaderboard).

#### Phase 6.4 - Frontend admin pages

User list/status toggle and simulation controls, behind a role-aware route guard.

### Phase 7 - Deployment

#### Phase 7.1 - Database provisioning

Provision MongoDB Atlas, document connection setup, turn index/seed creation into a repeatable script.

#### Phase 7.2 - Server deployment config

Deploy the Express API with health-check wiring and production env vars.

#### Phase 7.3 - Client deployment config

Deploy the React frontend with `VITE_API_BASE_URL`/`VITE_SOCKET_URL` pointed at the deployed server; update CORS to the deployed client origin.

#### Phase 7.4 - Staging validation

Staging smoke-test checklist and a final disclaimer/compliance review pass.

### Verification approach per sub-phase

- Backend sub-phases: start the server (`npm run dev` in `server/`), hit new endpoints with curl/Postman, confirm the error envelope shape on failure cases, and check that MongoDB collections/indexes were created as expected.
- Frontend sub-phases: start the client (`npm run dev` in `client/`) against the running server and click through the golden path in a browser.
- Jobs/sockets: verify via server logs and a connected socket client (or the browser dev tools network/WS tab) that events fire on the expected interval.
- From Phase 6.3 onward, run the automated test suite before/after touching backend logic.

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

## 11. Resolved decisions

1. **UI library:** none — plain CSS / CSS Modules, building on the existing `App.css`/`index.css` scaffold. No framework dependency added.
2. **Historical-data provider:** CoinGecko's free API, accessed only through the provider-agnostic market-data adapter (`server/src/services/marketData/adapter.js`) so the provider can be swapped later without touching callers.
3. **Trade fees / order types:** market orders only for MVP — no fees, no minimum order size beyond validation against wallet balance/holdings, no limit orders, no `orders` collection. Buy/sell execute immediately at the acting user's current simulated price. Limit orders are explicitly post-MVP.
4. **Simulation scope:** per-user, not global. Each user gets their own `simulationSession` (own seed, own difficulty), auto-created at registration and advanced continuously by a background tick job whether or not the user is online. Trades, displayed prices, and prediction outcomes are all resolved against that user's own simulated price path. Fairness on the leaderboard is preserved by ranking on portfolio return % relative to each user's own 100,000 BDT starting balance, not absolute BDT.
5. **Admin features:** deferred to Phase 6, after the core trading/learning/gamification loop is built, per the phase ordering above.
