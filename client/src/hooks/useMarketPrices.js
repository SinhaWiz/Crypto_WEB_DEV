import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socketClient';

/**
 * Hook to subscribe to market prices and real-time ticks
 * @param {string[]} symbols - Array of symbols to subscribe to (e.g. ['BTC', 'ETH'])
 */
export function useMarketPrices(symbols = []) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    if (!socket || symbols.length === 0) return;

    // Handler for the initial snapshot of prices
    const handleMarketPrices = (snapshotArray) => {
      setPrices((prev) => {
        const newPrices = { ...prev };
        snapshotArray.forEach((coin) => {
          if (symbols.includes(coin.symbol)) {
            newPrices[coin.symbol] = {
              ...newPrices[coin.symbol], // preserve any existing tick data if we want, or just overwrite
              ...coin,
            };
          }
        });
        return newPrices;
      });
    };

    // Handler for live simulated ticks
    const handleMarketTick = (tick) => {
      if (symbols.includes(tick.symbol)) {
        setPrices((prev) => {
          const oldPrice = prev[tick.symbol]?.price || 0;
          const newPrice = tick.priceBDT;
          
          return {
            ...prev,
            [tick.symbol]: {
              ...prev[tick.symbol],
              price: newPrice,
              direction: newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'same',
            },
          };
        });
      }
    };

    // Subscribe to symbols
    symbols.forEach(symbol => {
      socket.emit('market:subscribe', symbol);
    });

    socket.on('market:prices', handleMarketPrices);
    socket.on('market:tick', handleMarketTick);

    return () => {
      symbols.forEach(symbol => {
        socket.emit('market:unsubscribe', symbol);
      });
      socket.off('market:prices', handleMarketPrices);
      socket.off('market:tick', handleMarketTick);
    };
  }, [symbols.join(',')]); // re-run if the requested symbols change

  // Convert dictionary to array for easier rendering
  const pricesArray = symbols.map(symbol => ({
    symbol,
    ...(prices[symbol] || { price: 0, direction: 'same' })
  }));

  return pricesArray;
}
