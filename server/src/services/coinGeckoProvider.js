export const getCoinGeckoId = (symbol) => {
  const map = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    DOGE: 'dogecoin',
    XRP: 'ripple',
    BNB: 'binancecoin',
  };
  return map[symbol];
};

export const fetchMarketData = async (symbols) => {
  const ids = symbols.map(getCoinGeckoId).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Map response back to our symbols
    const results = [];
    for (const symbol of symbols) {
      const id = getCoinGeckoId(symbol);
      const coinData = data[id];
      if (coinData) {
        results.push({
          symbol,
          price: coinData.usd,
          marketCap: coinData.usd_market_cap,
          volume24h: coinData.usd_24h_vol,
          percentChange24h: coinData.usd_24h_change,
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Error fetching market data from CoinGecko:', error.message);
    throw error;
  }
};
