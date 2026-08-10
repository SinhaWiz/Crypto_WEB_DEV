# Staging Validation Checklist

Use this checklist after deploying the MongoDB database, Express API, and React client.

## Environment

- MongoDB Atlas cluster is reachable by the server host.
- `MONGODB_URI` uses the staging database, not a local or production database.
- `CLIENT_ORIGIN` exactly matches the deployed frontend origin.
- `VITE_API_BASE_URL` points to the deployed API `/api` path.
- `VITE_SOCKET_URL` points to the deployed API origin without `/api`.
- `JWT_SECRET` is a long generated value and is not committed.

## API Smoke Tests

```sh
curl https://<api-host>/api/health
```

- Health returns HTTP `200`.
- Response includes `database: "connected"`.
- Register, login, and `/api/auth/me` work with cookies.
- Unsupported or invalid payloads return the `{ error: { code, message, details } }` envelope.
- Admin routes reject non-admin users with HTTP `403`.

## Product Golden Path

- Register a staging user.
- Confirm the wallet starts with `100,000` virtual BDT and starter virtual points.
- Open the market page and confirm live price cards update.
- Open a coin detail page and confirm the chart renders.
- Submit a buy trade, then confirm the portfolio and transaction table update.
- Open a prediction challenge and confirm it appears in prediction history.
- Confirm leaderboard and achievements pages load.
- Confirm learning content loads.

## Jobs and Sockets

- Server logs show the simulation tick job running without repeated errors.
- Browser dev tools show the Socket.io connection using the deployed API origin.
- Historical refresh runs on the configured cron, if enabled.
- Prediction settlement resolves due challenges after their close time.

## Disclaimer and Compliance Review

- The persistent banner is visible after login and on protected app pages.
- The banner text matches:

```text
Educational simulator only. All balances, trades, prices, and rewards are virtual; no real cryptocurrency or financial transaction occurs.
```

- No page offers deposits, withdrawals, real wallets, exchange execution, margin, leverage, shorting, prizes, or payouts.
- UI copy uses virtual BDT, simulated coins, virtual points, and educational framing.
- API routes do not expose real-money deposit, withdrawal, or wallet-address functionality.
