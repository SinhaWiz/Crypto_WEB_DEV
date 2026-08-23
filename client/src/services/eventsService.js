import { httpClient } from './httpClient';

/**
 * Fetch the market event catalog: { code, title, description, symbols, impactPercent, costPoints }[].
 */
export const getMarketEvents = async () => {
  const response = await httpClient.get('/api/events');
  return response.events;
};

/**
 * Pay points to trigger a market event on the caller's own simulated session.
 * Returns { event, wallet }.
 */
export const triggerMarketEvent = async (code) => {
  return httpClient.post(`/api/events/${code}/trigger`);
};

/**
 * Fetch the caller's recent event log (their own triggers + ambient ones).
 */
export const getMarketEventLog = async () => {
  const response = await httpClient.get('/api/events/log');
  return response.events;
};
