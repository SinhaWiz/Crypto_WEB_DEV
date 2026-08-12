import { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../services/socketClient';

export function useMarketPrices(initialCoins = []) {
  const [prices, setPrices] = useState({});
  const [series, setSeries] = useState({});
  const [flashes, setFlashes] = useState({});
  const [connectionState, setConnectionState] = useState('connecting');
  const previousPricesRef = useRef({});

  useEffect(() => {
    setPrices((current) => {
      const next = { ...current };
      initialCoins.forEach((coin) => {
        const sym = typeof coin === 'string' ? coin : coin.symbol;
        if (!next[sym]) {
          next[sym] = {
            symbol: sym,
            priceBDT: coin.priceBDT ?? coin.price ?? coin.close,
            timestamp: coin.timestamp,
            percentChange24h: coin.percentChange24h ?? coin.changePercent24h,
            volume24h: coin.volume24h ?? coin.volume,
            marketCap: coin.marketCap,
          };
        }
      });
      previousPricesRef.current = next;
      return next;
    });
  }, [initialCoins.join(',')]); // We join by comma to mimic the original backup while keeping hook deps happy

  useEffect(() => {
    if (!socket) return;

    function mergeIncoming(incomingPrices = []) {
      const now = Date.now();

      setPrices((current) => {
        const next = { ...current };
        const nextFlashes = {};

        incomingPrices.forEach((price) => {
          const previousPrice = previousPricesRef.current[price.symbol]?.priceBDT;
          const normalizedPriceBDT = price.priceBDT ?? price.price ?? price.close;
          const normalizedVolume = price.volume24h ?? price.volume;
          
          next[price.symbol] = {
            ...current[price.symbol],
            ...price,
            priceBDT: normalizedPriceBDT,
            volume24h: normalizedVolume,
            percentChange24h: price.percentChange24h ?? price.changePercent24h ?? current[price.symbol]?.percentChange24h,
          };

          if (previousPrice && previousPrice !== normalizedPriceBDT) {
            nextFlashes[price.symbol] = normalizedPriceBDT > previousPrice ? 'up' : 'down';
          }
        });

        if (Object.keys(nextFlashes).length > 0) {
          setFlashes((currentFlashes) => ({ ...currentFlashes, ...nextFlashes }));
        }

        previousPricesRef.current = next;
        return next;
      });

      setSeries((current) => {
        const next = { ...current };

        incomingPrices.forEach((price) => {
          const point = {
            symbol: price.symbol,
            priceBDT: price.priceBDT ?? price.price ?? price.close,
            timestamp: price.timestamp ?? now,
          };
          next[price.symbol] = [...(current[price.symbol] ?? []), point].slice(-120);
        });

        return next;
      });
    }

    function handleConnect() {
      setConnectionState('connected');
      // In my implementation, market:subscribe takes a symbol. In the backup it takes nothing and returns all active ones. 
      // I will emit for all initialCoins individually if needed, or let the server handle it.
      initialCoins.forEach((coin) => {
        socket.emit('market:subscribe', typeof coin === 'string' ? coin : coin.symbol);
      });
    }

    function handleDisconnect() {
      setConnectionState('disconnected');
    }

    // In my server, market:prices returns an array directly, but backup expected { prices: [...] }. I'll handle both.
    function handlePrices(payload) {
      if (Array.isArray(payload)) {
        mergeIncoming(payload);
      } else if (payload && payload.prices) {
        mergeIncoming(payload.prices);
      } else if (payload && payload.tick) {
        // Handle single tick from current server implementation
        mergeIncoming([payload.tick]);
      } else if (payload && payload.priceBDT) {
         mergeIncoming([payload]);
      }
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('market:prices', handlePrices);
    socket.on('market:tick', handlePrices);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      initialCoins.forEach((coin) => {
        socket.emit('market:unsubscribe', typeof coin === 'string' ? coin : coin.symbol);
      });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('market:prices', handlePrices);
      socket.off('market:tick', handlePrices);
    };
  }, [initialCoins.join(',')]);

  useEffect(() => {
    if (Object.keys(flashes).length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFlashes({});
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [flashes]);

  const orderedPrices = useMemo(
    () =>
      initialCoins.map((coin) => {
        const sym = typeof coin === 'string' ? coin : coin.symbol;
        return {
          ...(typeof coin === 'string' ? { symbol: sym } : coin),
          ...prices[sym],
        };
      }),
    [initialCoins, prices]
  );

  return { prices: orderedPrices, flashes, connectionState, series };
}
