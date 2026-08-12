# Educational Crypto Trading Simulator - Agent Context & Rules

This file provides critical context, boundaries, and current state information for any AI coding agents working on this project. **Agents must read and adhere to this context to avoid hallucinating features, implementing excluded functionality, or breaking the project's educational goals.**

## 1. Project Context & Goals
- **Purpose**: This is a university lab project designed to teach users the basics of cryptocurrency trading (e.g., long, short, market volatility) without any real financial risk. 
- **Disclaimer**: The platform must constantly display a prominent disclaimer: *"Educational simulator only. All balances, trades, prices, and rewards are virtual; no real cryptocurrency or financial transaction occurs."*
- **Excluded Features**: Real cryptocurrency wallets, real-money deposits/withdrawals, exchange order execution, futures/margin/shorting, betting or real prize payouts. Do NOT implement these.
- **Technology Stack**:
  - Frontend: React 19 (via Vite), React Router, Context API, Tailwind CSS.
  - Backend: Node.js, Express, MongoDB (Mongoose), Socket.io.

## 2. Overall Project Plan
The project is divided into 7 phases (detailed in `plan.md`). 
- **Phase 0 & 1**: Foundation, User Identity, and Virtual Wallet.
- **Phase 2**: Historical Market Data (CoinGecko integration).
- **Phase 3**: Simulation Engine and Live UI (WebSockets).
- **Phase 4**: Trading (Buy/Sell) and Portfolio Management.
- **Phase 5**: Gamification (Predictions, Leaderboard, Achievements, Learning).
- **Phase 6 & 7**: Admin Controls, Testing, and Deployment.

## 3. Current State (As of Last Sync)
**CRITICAL NOTE**: The repository underwent a hard reset. Several previously implemented phases (Gamification, Trading, Live Simulation) were completely deleted to align with the core baseline.

**What is currently IMPLEMENTED:**
- **Backend (Phase 0 & 1.1-1.3)**: Mongoose models for `User` and `Wallet` exist. Auth routes (`/api/auth`, `/api/users`, `/api/wallet`) and their controllers/services are functional.
- **Frontend (Phase 1.4-1.5)**: React Router setup, `AuthContext`, and UI components (`DisclaimerBanner`, `ProtectedRoute`, `RootLayout`). Authentication pages (`LoginPage`, `RegisterPage`, and basic `DashboardPage`) are built using Tailwind CSS.
- **Phase 2 (Historical Market Data)**: The strict `adapter.js` interface, `PriceHistory` OHLCV Mongoose model, `historicalRefreshJob.js` (cron), `seed:history` script, and `/api/coins/:symbol` route are implemented. The frontend `MarketPage` successfully displays live fetched coin prices.

**What is currently MISSING (Pending Reimplementation):**
- **Backend & Frontend (Phases 3-7)**: All models, routes, services, sockets, and UI components for Simulation, Trading, Gamification, and Admin features are currently absent from the `main` branch. 

*Note: A standalone "Discussion Forum" module is actively being developed on a separate branch (`module/discussion-forum`), but is not part of this baseline.*

## 4. What's Next?
The immediate next steps involve rebuilding the project incrementally:
1. **Phase 3**: Implement the Simulation Engine and WebSockets to push live ticks. This includes the `SimulationSession` model and the `simulationTickJob.js`.

## 5. Agent Behavioral Rules
1. **Never Assume Existing Code**: Do not assume gamification, trading, or socket implementations exist in the current `main` branch. Verify the `client/src` and `server/src` directories before making assumptions.
2. **Follow the Phases**: Implement exactly one phase at a time as outlined in `plan.md`. Do not jump ahead or over-engineer features.
3. **No Real Money**: Always enforce the virtual nature of the simulator. All balances are in "virtual BDT".
4. **Tailwind CSS & Styling**: You may use Tailwind CSS as it makes styling easier. Keep the styling and UI clean and modern, but avoid overly complex CSS layouts, themes, or excessive customizations.
5. **Code Simplicity**: Implement features in a clean, comprehensive, and easy-to-understand way. Do not introduce unnecessary complexity, tricky hacks, or over-engineered abstractions. Prioritize functional, readable code.
6. **UI/UX Aesthetics**: Build a clean, modern interface. Use good design principles, but do not leave placeholder text or ugly generic UI components.
