# CryptoSim — System Overview

## 1. What Is This Project?

CryptoSim is an **educational crypto trading simulator** — a full-stack web application that lets users practice cryptocurrency trading without any real money or financial risk. It was built as a web development course lab project using **React** (frontend), **Express.js** (backend), and **MongoDB/Mongoose** (database).

### The Problem It Solves

In Bangladesh, holding and using cryptocurrencies is illegal. Most people therefore have no hands-on experience with how crypto markets actually work — the volatility, the risks, the jargon. CryptoSim bridges that gap by providing a realistic, gamified simulation where users can:

- Trade 6 major cryptocurrencies (BTC, ETH, SOL, DOGE, XRP, BNB) with virtual BDT
- Experience live, **per-user** simulated price movements
- Practice both **spot trading** and **leveraged long/short positions**
- Learn trading concepts (market orders, portfolio management, P&L, short selling)
- Compete on a leaderboard, earn achievements, and place prediction challenges

> **Disclaimer (always displayed):** *"Educational simulator only. All balances, trades, prices, and rewards are virtual; no real cryptocurrency or financial transaction occurs."*

---

## 2. Features at a Glance

| Feature | Description |
|---|---|
| **User Registration & Login** | JWT-based auth with httpOnly cookies; password hashed with bcrypt |
| **Virtual Wallet** | Each user starts with ৳100,000 BDT + 100 virtual points |
| **Live Simulated Market** | Per-user price feeds generated via Geometric Brownian Motion, delivered over WebSocket every 3 seconds |
| **Spot Market Buy/Sell** | Instant market orders against the user's own simulated price (MongoDB transactions) |
| **Leveraged Long & Short** | Open long/short positions with 1x–10x leverage using real broker-style margin + buy/sell settlement |
| **Portfolio & P/L Tracking** | Spot holdings (average-cost basis) + open leveraged positions with unrealized/realized P/L |
| **Transaction History** | Paginated log of all spot and position trades |
| **Price Charts** | Historical daily candles + live simulation ticks (Recharts) |
| **Prediction Challenges** | Stake virtual points on price direction within a time window; auto-settled by background job |
| **Buy Virtual Points** | Convert cash (BDT) into virtual points at a fixed rate (1 point = ৳1,000) |
| **Achievements** | 17 achievements auto-evaluated after trades and predictions |
| **Leaderboard** | Users ranked by portfolio return % (fair across independent price paths) |
| **Learning Content** | Static educational lessons on crypto basics, trading, risk, and the simulator itself |
| **Educational Disclaimer** | Persistent banner on every page |

---

## 3. Technology Stack

```
Frontend (client/)              Backend (server/)
─────────────────               ─────────────────
React 19                        Node.js + Express 5
React Router 7                  MongoDB + Mongoose 9
Tailwind CSS 4                  Socket.io 4
Recharts 3                      JWT (jsonwebtoken)
Axios                           bcryptjs
Socket.io-client                node-cron
Vite 8                          Zod (validation)
                                Helmet, CORS, morgan
                                express-rate-limit
```

---

## 4. Supported Assets & Constants

| Constant | Value |
|---|---|
| Supported symbols | BTC, ETH, SOL, DOGE, XRP, BNB |
| Starting cash | ৳100,000 BDT |
| Starting virtual points | 100 |
| Trade fee rate | 0.8% (0.008) |
| Leverage range | 1x – 10x |
| Position sides | `long`, `short` |
| Points exchange rate | 1 point = ৳1,000 |
| BDT per USD (display) | 120 |
| Price tick interval | 3 seconds |

---

## 5. Core Features — How They Work

### 5.1 Authentication
- **Register**: Creates `User` + `Wallet` + `SimulationSession` in one flow.
- **Login / Logout**: JWT stored in httpOnly cookie (`token`).
- Frontend `AuthContext` keeps user state; `ProtectedRoute` guards private pages.

### 5.2 Virtual Wallet
- **Cash (BDT)** — used for spot trades and leveraged positions.
- **Virtual Points** — used only for Prediction Challenges.
- Users can **buy more points** with cash at a fixed rate of ৳1,000 per point.

### 5.3 Live Simulated Market
- Every user has an independent `SimulationSession` with its own random seed.
- Prices are generated with **Geometric Brownian Motion (GBM)**.
- Difficulty presets change volatility & drift:
  - Beginner → lower volatility
  - Intermediate
  - Expert → higher volatility
- A background job (`simulationTickJob`) advances **all active sessions every 3 seconds**.
- New ticks are stored as `SimulatedPriceTick` and pushed to the user via **Socket.io** (`market:tick`).
- Historical daily candles come from CoinGecko (seeded + hourly refresh job).

### 5.4 Spot Trading (Market Orders)
- **Buy**: Debit cash (price × qty + fee) → increase `PortfolioHolding` (average-cost basis).
- **Sell**: Must already own the asset → credit cash, reduce holding, book realized P/L.
- Fee = 0.8% of notional.
- All executions use the **user’s own latest simulated price**.
- Atomic via MongoDB transactions.

### 5.5 Leveraged Positions (Long & Short) — Real Mechanics

Positions are **separate** from spot holdings (`LeveragedPosition` model).

#### Opening a position
- User chooses **side** (`long` / `short`), **quantity**, and **leverage** (1–10x).
- **Margin** locked from free cash = `entryPrice × quantity`.
- **Notional** (full exposure) = `margin × leverage`.
- Fee is charged on the notional.
- Cash change on open (both sides):
  ```
  Cash −= margin + fee
  ```
- The large notional buy/sell is treated as **financed / held collateral** (broker-style).
- Transaction is recorded with the correct side (`buy` for long open, `sell` for short open).

#### Closing a position
- Can close full or partial quantity.
- **PnL formula**:
  ```
  direction = long ? +1 : −1
  PnL = direction × (livePrice − entryPrice) × quantity × leverage
  ```
  (Loss is capped at the locked margin.)
- Cash returned:
  ```
  Cash += marginReleased + PnL − fee
  ```
- Long close = real sell of the financed position.
- Short close = real **buy-to-cover** (return borrowed asset).
- Only one open position per `(user, symbol, side)` is allowed.

#### Key difference from spot
- Leveraged positions **do not** appear in the spot “Holdings” table.
- They appear only under **Open Positions** in the Portfolio page.
- Closing is done from the Trade Panel in **Position** mode (not Spot mode).

### 5.6 Portfolio & P/L
- **Spot holdings**: quantity, average buy price, market value, unrealized P/L, allocation pie chart.
- **Open leveraged positions**: side, leverage, entry, current price, exposure, unrealized P/L %.
- Total portfolio value and overall return percentage.

### 5.7 Prediction Challenges
- Stake **virtual points** (not cash).
- Choose coin, direction (`up` / `down`), stake amount, and duration (15 seconds – 24 hours).
- Snapshot of the user’s live simulated price is taken at creation.
- Background job (`predictionSettlementJob`) runs every minute and settles expired challenges:
  - Correct → points doubled (stake returned + equal profit).
  - Wrong → stake forfeited.
- Results stored on `PredictionChallenge` (`pending` / `win` / `loss`).

### 5.8 Achievements (17 total)
Automatically evaluated after trades and predictions:

| Code | Title | Condition |
|---|---|---|
| FIRST_TRADE | First Trade | ≥ 1 trade |
| FIVE_TRADES | Active Trader | ≥ 5 trades |
| TEN_TRADES | Seasoned Trader | ≥ 10 trades |
| TWENTY_TRADES | Market Veteran | ≥ 20 trades |
| FIRST_SELL | Profit Taker | ≥ 1 sell |
| FIRST_PREDICTION | Fortune Teller | ≥ 1 prediction |
| PREDICTION_WINNER | Called It | ≥ 1 prediction win |
| FIVE_WINS | Market Oracle | ≥ 5 prediction wins |
| TEN_WINS | Prediction Master | ≥ 10 prediction wins |
| BIG_WINNER | High Roller | Win a prediction with ≥ 50 points staked |
| WALLET_MILESTONE | Doubled Up | Cash ≥ 2× starting balance |
| TRIPLE_UP | Triple Up | Cash ≥ 3× starting balance |
| WINNING_STREAK | Winning Streak | 5 consecutive profitable sells |
| STREAK_MASTER | Streak Master | Higher streak threshold |
| DIVERSIFIED | Diversified Portfolio | Hold ≥ 3 different coins |
| FULL_PORTFOLIO | Full Spectrum | Hold all 6 coins at once |
| POINTS_COLLECTOR | Points Collector | Accumulate points milestone |

### 5.9 Leaderboard
- Ranked by **portfolio return percentage**.
- Fair across users because each has an independent simulated price path.
- Top N users returned (default 50).

### 5.10 Learning Content
Static lessons covering:
- What is Cryptocurrency?
- How Buying and Selling Works
- Reading Price Charts
- Market Volatility
- Risk Management Basics
- Predictions, Points, and Achievements

---

## 6. Background Jobs

| Job | Frequency | Purpose |
|---|---|---|
| `simulationTickJob` | Every 3 s | Advances GBM price for every active `SimulationSession` and emits WebSocket ticks |
| `predictionSettlementJob` | Every 1 min | Settles expired prediction challenges and pays/takes points |
| `historicalRefreshJob` | Hourly | Syncs latest real market prices from CoinGecko for chart anchors |

---

## 7. Real-time Layer (Socket.io)

- Client connects with the JWT cookie.
- Joins a private room for that user.
- Events:
  - `market:subscribe` → server sends full price snapshot
  - `market:tick` → new prices every 3 seconds (per-user)
- Used on Market page and Coin detail page for live prices.

---

## 8. Frontend Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Home / Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard overview | Protected |
| `/market` | Market list of 6 coins | Protected |
| `/market/:symbol` | Coin detail + Trade Panel + Chart | Protected |
| `/portfolio` | Spot holdings + Open Positions + History | Protected |
| `/wallet` | Cash & Points balances, buy points | Protected |
| `/predictions` | Create & view prediction challenges | Protected |
| `/leaderboard` | Ranked users | Protected |
| `/achievements` | Unlocked achievements | Protected |
| `/learning` | Educational lessons | Protected |

---

## 9. Data Models (MongoDB)

- `User`
- `Wallet` (cashBalanceBDT, virtualPoints)
- `SimulationSession` (per-user price path)
- `SimulatedPriceTick`
- `PriceHistory` (daily candles)
- `PortfolioHolding` (spot only)
- `LeveragedPosition` (long/short, margin, leverage, status)
- `Transaction` (spot + position trades)
- `PredictionChallenge`
- `Achievement`

---

## 10. Key Design Decisions

1. **Per-user price simulation** — every trader sees a different market path. This keeps the leaderboard fair and prevents shared-order-book complexity.
2. **Spot vs Leveraged separation** — leveraged positions never touch `PortfolioHolding`. They are tracked only in `LeveragedPosition` and shown under “Open Positions”.
3. **Broker-style margin** — only margin is taken from free cash on open; the large notional is treated as financed/held. On close, margin is released and pure PnL is settled. This matches how real brokers handle leveraged and short positions while remaining safe for an educational simulator.
4. **Real directional semantics**:
   - Long open → recorded as `buy`
   - Long close → recorded as `sell`
   - Short open → recorded as `sell` (borrow + sell)
   - Short close → recorded as `buy` (buy-to-cover)
5. **Atomicity** — critical wallet/position mutations use MongoDB transactions.
6. **Educational first** — persistent disclaimer, learning section, and no real-money pathways.

---

## 11. Repository Layout

```
Crypto_WEB_DEV/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                  # Route definitions
│   │   ├── main.jsx
│   │   ├── components/              # UI components (TradePanel, etc.)
│   │   ├── features/auth/           # AuthContext
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/                   # 12 pages
│   │   └── services/                # API clients
│   └── package.json
├── server/                          # Express backend
│   ├── src/
│   │   ├── index.js                 # Server + Socket.io + jobs
│   │   ├── app.js
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── data/learningContent.js
│   │   ├── jobs/                    # 3 background jobs
│   │   ├── middlewares/
│   │   ├── models/                  # 10 models
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   │   ├── positionService.js   # Real long/short logic
│   │   │   ├── tradeService.js      # Spot buy/sell
│   │   │   ├── simulation/          # GBM engine
│   │   │   └── ...
│   │   ├── socket/
│   │   └── utils/
│   └── package.json
├── README.md                        # This file
├── DESIGN.md
└── plan.md
```

---

## 12. Running Locally

```bash
# Backend
cd server
cp .env.example .env          # set MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev

# Frontend
cd client
cp .env.example .env          # VITE_API_BASE_URL, VITE_SOCKET_URL
npm install
npm run dev
```

MongoDB must be running as a **replica set** (transactions are used).

---

*Last updated to reflect real long/short cash-flow mechanics, full achievement list (17), points purchase, and current architecture.*
