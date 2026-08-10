import { httpClient } from './httpClient';

export async function listCoins() {
  const { data } = await httpClient.get('/coins');
  return data.coins;
}

export async function getCoin(symbol) {
  const { data } = await httpClient.get(`/coins/${symbol}`);
  return data.coin;
}

export async function getCoinHistory(symbol, params = {}) {
  const { data } = await httpClient.get(`/coins/${symbol}/history`, { params });
  return data.candles;
}
