# Deployment Guide

## Phase 7.1 - Database Provisioning

1. Create a MongoDB Atlas project and a dedicated cluster for the simulator.
2. Create an application database user with read/write access to the simulator database only.
3. Add the server deployment provider's outbound IPs to Atlas Network Access, or use a temporary `0.0.0.0/0` rule only for early staging.
4. Copy the Atlas connection string into the server environment as `MONGODB_URI`.
5. Prepare indexes after every schema/index change:

```sh
cd server
npm run db:prepare
```

6. Seed historical market data for a fresh staging database:

```sh
cd server
npm run db:prepare -- --seed-history
```

The preparation script imports every Mongoose model, syncs indexes, and can run the historical refresh job as a repeatable seed step.

## Phase 7.2 - Server Deployment Config

The repository includes a `render.yaml` blueprint for the Express API. It deploys the `server/` package, runs `npm install`, starts with `npm start`, and uses `/api/health` as the platform health check.

Required production environment variables:

```text
NODE_ENV=production
PORT=10000
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=<deployed frontend origin>
MARKET_DATA_PROVIDER=coingecko
MARKET_DATA_API_KEY=
PRICE_TICK_INTERVAL_MS=3000
HISTORICAL_REFRESH_CRON=0 */6 * * *
```

After the service is deployed, confirm:

```sh
curl https://<api-host>/api/health
```

A healthy response returns HTTP `200` with `database: "connected"`. A disconnected database returns HTTP `503` so the host can keep the deployment out of rotation.
