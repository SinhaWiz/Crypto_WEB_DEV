import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { ERROR_CODES } from './constants/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import coinRoutes from './routes/coinRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: env.NODE_ENV });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/coins', coinRoutes);
  app.use('/api', tradeRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api', gamificationRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Not found' },
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const code = err.code || ERROR_CODES.INTERNAL_ERROR;
    res.status(status).json({
      error: {
        code,
        message: err.message || 'Internal server error',
        ...(err.details ? { details: err.details } : {}),
      },
    });
  });

  return app;
}
