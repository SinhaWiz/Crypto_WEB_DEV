import { MARKET_EVENTS, triggerEvent, getRecentEvents } from '../services/marketEventService.js';

export async function listEvents(req, res) {
  res.json({ events: MARKET_EVENTS });
}

export async function triggerEventHandler(req, res) {
  const io = req.app.get('io');
  const { event, wallet } = await triggerEvent({ userId: req.user.id, code: req.params.code, io });
  res.json({ event, wallet });
}

export async function getEventLog(req, res) {
  const events = await getRecentEvents(req.user.id);
  res.json({ events });
}
