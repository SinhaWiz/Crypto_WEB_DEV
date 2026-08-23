import { AUTH_COOKIE_NAME, ERROR_CODES } from '../constants/index.js';
import { verifyToken } from '../utils/jwt.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { buildSimulatedSnapshot } from '../services/simulation/engine.js';

/**
 * Parse a raw cookie header string into a key-value object.
 */
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

/**
 * Socket.io middleware — verifies the JWT from the httpOnly cookie.
 */
export function authenticateSocket(socket, next) {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    socket.data.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error('Invalid or expired session'));
  }
}

/**
 * Register all market-related socket event handlers on the io instance.
 */
export function registerMarketSocketHandlers(io) {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const room = userRoom(socket.data.user.id);
    socket.join(room);

    // Client subscribes to market prices — re-join room and immediately send a full snapshot
    socket.on('market:subscribe', async () => {
      try {
        // Always re-join user room (in case of re-subscribe after navigation)
        socket.join(room);

        const session = await SimulationSession.findOne({
          userId: socket.data.user.id,
          status: 'active',
        });

        const prices = session ? await buildSimulatedSnapshot(session) : [];
        socket.emit('market:prices', { prices });
      } catch (err) {
        console.error('Error building market snapshot:', err.message);
      }
    });

    // Note: market:unsubscribe does NOT remove from the user room.
    // The user:${id} room is personal and must stay active for the entire
    // socket connection so that background tick events keep flowing even
    // when the client is between page navigations.
    socket.on('market:unsubscribe', () => {
      // intentionally a no-op for the room — client just stops listening locally
    });
  });
}

/**
 * Emit a batch of price ticks to a specific user's room.
 * Ticks are sent as { prices: [...] } so the client hook can handle them uniformly.
 *
 * @param {import('socket.io').Server} io
 * @param {string} userId
 * @param {Array<{symbol, priceBDT, generatedAt, sourceWindow}>} ticks
 */
export function emitMarketTicks(io, userId, ticks) {
  if (!io || ticks.length === 0) return;

  const prices = ticks.map((tick) => ({
    symbol: tick.symbol,
    priceBDT: tick.priceBDT,
    timestamp: tick.generatedAt,
    sourceWindow: tick.sourceWindow,
    percentChange24h: tick.percentChange24h,
  }));

  io.to(userRoom(userId)).emit('market:tick', { prices });
}

/**
 * Notify a specific user that their wallet has changed and the client should
 * refresh cached balances/points from the API.
 */
export function emitWalletUpdate(io, userId) {
  if (!io) return;

  io.to(userRoom(userId)).emit('wallet:update', {
    userId: userId.toString(),
  });
}
