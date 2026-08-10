import { AUTH_COOKIE_NAME, ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { buildSimulatedSnapshot } from '../services/simulation/engine.js';

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, part) => {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name) return cookies;
    cookies[name] = decodeURIComponent(valueParts.join('='));
    return cookies;
  }, {});
}

function userRoom(userId) {
  return `user:${userId}`;
}

export function authenticateSocket(socket, next) {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    next(new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED));
    return;
  }

  try {
    const payload = verifyToken(token);
    socket.data.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired session', 401, ERROR_CODES.UNAUTHORIZED));
  }
}

export function registerMarketSocketHandlers(io) {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const room = userRoom(socket.data.user.id);
    socket.join(room);

    socket.on('market:subscribe', async (symbol, callback) => {
      try {
        const requestedSymbol = typeof symbol === 'string' ? symbol.toUpperCase() : null;
        const session = await SimulationSession.findOne({ userId: socket.data.user.id, status: 'active' });
        const prices = session ? await buildSimulatedSnapshot(session) : [];
        const filteredPrices =
          requestedSymbol && SUPPORTED_SYMBOLS.includes(requestedSymbol)
            ? prices.filter((price) => price.symbol === requestedSymbol)
            : prices;

        socket.emit('market:prices', { prices: filteredPrices });
        callback?.({ ok: true });
      } catch (err) {
        callback?.({ ok: false, message: err.message });
      }
    });

    socket.on('market:unsubscribe', () => {
      socket.leave(room);
    });
  });
}

export function emitMarketTicks(io, userId, ticks) {
  if (!io || ticks.length === 0) return;

  const prices = ticks.map((tick) => ({
    symbol: tick.symbol,
    priceBDT: tick.priceBDT,
    timestamp: tick.generatedAt,
    sourceWindow: tick.sourceWindow,
  }));

  io.to(userRoom(userId)).emit('market:tick', { prices });
}
