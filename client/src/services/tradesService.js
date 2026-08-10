import { httpClient } from './httpClient';

export async function buyCoin({ symbol, quantity }) {
  const { data } = await httpClient.post('/trades/buy', { symbol, quantity });
  return data;
}

export async function sellCoin({ symbol, quantity }) {
  const { data } = await httpClient.post('/trades/sell', { symbol, quantity });
  return data;
}

export async function getPortfolio() {
  const { data } = await httpClient.get('/portfolio');
  return data;
}

export async function getTransactions(params = {}) {
  const { data } = await httpClient.get('/transactions', { params });
  return data;
}
