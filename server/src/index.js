import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHistoricalRefreshJob } from './jobs/historicalRefreshJob.js';
import { startSimulationTickJob } from './jobs/simulationTickJob.js';

async function start() {
  await connectDB();
  startHistoricalRefreshJob();
  startSimulationTickJob();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('market:subscribe', (symbol) => socket.join(`market:${symbol}`));
    socket.on('market:unsubscribe', (symbol) => socket.leave(`market:${symbol}`));
  });

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
