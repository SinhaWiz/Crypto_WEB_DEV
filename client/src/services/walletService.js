import { httpClient } from './httpClient';

export async function getWallet() {
  const { data } = await httpClient.get('/wallet');
  return data.wallet;
}
