import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHistoricalRefreshJob } from './jobs/historicalRefreshJob.js';
import { startSimulationTickJob } from './jobs/simulationTickJob.js';
import { registerMarketSocketHandlers } from './socket/marketSocket.js';

async function start() {
  await connectDB();
  startHistoricalRefreshJob();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  registerMarketSocketHandlers(io);
  startSimulationTickJob(io);

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
