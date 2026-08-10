import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '../services/socketClient';

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
        if (!next[coin.symbol]) {
          next[coin.symbol] = {
            symbol: coin.symbol,
            priceBDT: coin.priceBDT ?? coin.price,
            timestamp: coin.timestamp,
            changePercent24h: coin.changePercent24h,
          };
        }
      });
      previousPricesRef.current = next;
      return next;
    });
  }, [initialCoins]);

  useEffect(() => {
    const socket = getSocket();

    function mergeIncoming(incomingPrices = []) {
      const now = Date.now();

      setPrices((current) => {
        const next = { ...current };
        const nextFlashes = {};

        incomingPrices.forEach((price) => {
          const previousPrice = previousPricesRef.current[price.symbol]?.priceBDT;
          next[price.symbol] = {
            ...current[price.symbol],
            ...price,
          };

          if (previousPrice && previousPrice !== price.priceBDT) {
            nextFlashes[price.symbol] = price.priceBDT > previousPrice ? 'up' : 'down';
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
            priceBDT: price.priceBDT,
            timestamp: price.timestamp ?? now,
          };
          next[price.symbol] = [...(current[price.symbol] ?? []), point].slice(-120);
        });

        return next;
      });
    }

    function handleConnect() {
      setConnectionState('connected');
      socket.emit('market:subscribe');
    }

    function handleDisconnect() {
      setConnectionState('disconnected');
    }

    function handlePrices(payload) {
      mergeIncoming(payload?.prices);
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
      socket.emit('market:unsubscribe');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('market:prices', handlePrices);
      socket.off('market:tick', handlePrices);
    };
  }, []);

  useEffect(() => {
    if (Object.keys(flashes).length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFlashes({});
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [flashes]);

  const orderedPrices = useMemo(
    () =>
      initialCoins.map((coin) => ({
        ...coin,
        ...prices[coin.symbol],
      })),
    [initialCoins, prices]
  );

  return { prices: orderedPrices, flashes, connectionState, series };
}
