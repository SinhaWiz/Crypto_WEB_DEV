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
