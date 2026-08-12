import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHistoricalRefreshJob } from './jobs/historicalRefreshJob.js';
import { startSimulationTickJob, setIoInstance } from './jobs/simulationTickJob.js';
import { getLatestPrices } from './services/coinService.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

async function start() {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  setIoInstance(io);

  io.use((socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.jwt;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.userId = decoded.id;
      next();
    });
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('market:subscribe', async (symbol) => {
      socket.join(`market:${symbol}`);
      
      // Send a snapshot of the latest prices immediately
      try {
        const prices = await getLatestPrices();
        socket.emit('market:prices', prices);
      } catch (err) {
        console.error('Error fetching prices on subscribe:', err.message);
      }
    });

    socket.on('market:unsubscribe', (symbol) => {
      socket.leave(`market:${symbol}`);
    });
  });

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
    
    // Start background jobs after server starts
    startHistoricalRefreshJob();
    startSimulationTickJob();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
