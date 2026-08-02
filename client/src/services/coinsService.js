import { httpClient } from './httpClient';

export async function listCoins() {
  const { data } = await httpClient.get('/coins');
  return data.coins;
}
