import { httpClient } from './httpClient';

export const getPrices = async () => {
  const response = await httpClient.get('/api/coins');
  return response.prices;
};

export const getHistory = async (symbol) => {
  const response = await httpClient.get(`/api/coins/${symbol}/history`);
  return response.history;
};

export const refreshPrices = async () => {
  const response = await httpClient.post('/api/coins/refresh');
  return response.prices;
};
