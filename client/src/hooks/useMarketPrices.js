import { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../services/socketClient';

/**
 * useMarketPrices
 *
 * Subscribes to live simulated price ticks via WebSocket and maintains
 * an up-to-date price state for the given coins.
 *
 * @param {Array<string | { symbol: string, priceBDT?: number, ... }>} initialCoins
 *   - Pass SUPPORTED_SYMBOLS (string array) from the market page,
 *     or an array of coin objects with initial DB prices for the detail page.
 * @returns {{ prices, flashes, connectionState, series }}
 */
export function useMarketPrices(initialCoins = []) {
  const [prices, setPrices] = useState({});
  const [series, setSeries] = useState({});
  const [flashes, setFlashes] = useState({});
  const [connectionState, setConnectionState] = useState('connecting');
  const previousPricesRef = useRef({});

  // Seed state from initial coin data (e.g. fetched from REST before socket connects)
  useEffect(() => {
    if (initialCoins.length === 0) return;

    setPrices((current) => {
      const next = { ...current };
      initialCoins.forEach((coin) => {
        const sym = typeof coin === 'string' ? coin : coin.symbol;
        if (!next[sym] && typeof coin !== 'string') {
          next[sym] = {
            symbol: sym,
            priceBDT: coin.priceBDT,
            percentChange24h: coin.percentChange24h ?? null,
            volume24h: coin.volume24h ?? null,
            marketCap: coin.marketCap ?? null,
            timestamp: coin.timestamp ?? null,
          };
        }
      });
      previousPricesRef.current = next;
      return next;
    });
  }, [initialCoins.map((c) => (typeof c === 'string' ? c : c.symbol)).join(',')]); // eslint-disable-line

  // Socket connection + event handlers
  useEffect(() => {
    if (!socket) return;

    /**
     * Process an incoming array of price objects and update state.
     * Handles both market:prices (full snapshot) and market:tick (incremental).
     */
    function mergeIncoming(incomingPrices = []) {
      const now = Date.now();

      setPrices((current) => {
        const next = { ...current };
        const nextFlashes = {};

        incomingPrices.forEach((price) => {
          const previousPrice = previousPricesRef.current[price.symbol]?.priceBDT;

          next[price.symbol] = {
            ...current[price.symbol],
            symbol: price.symbol,
            priceBDT: price.priceBDT,
            percentChange24h: price.percentChange24h ?? current[price.symbol]?.percentChange24h ?? null,
            volume24h: price.volume24h ?? current[price.symbol]?.volume24h ?? null,
            marketCap: price.marketCap ?? current[price.symbol]?.marketCap ?? null,
            timestamp: price.timestamp ?? now,
          };

          if (previousPrice !== undefined && previousPrice !== price.priceBDT) {
            nextFlashes[price.symbol] = price.priceBDT > previousPrice ? 'up' : 'down';
          }
        });

        if (Object.keys(nextFlashes).length > 0) {
          setFlashes((f) => ({ ...f, ...nextFlashes }));
        }

        previousPricesRef.current = next;
        return next;
      });

      // Append points to the live series (capped at 120 points per coin)
      setSeries((current) => {
        const next = { ...current };
        incomingPrices.forEach((price) => {
          const point = { symbol: price.symbol, priceBDT: price.priceBDT, timestamp: price.timestamp ?? now };
          next[price.symbol] = [...(current[price.symbol] ?? []), point].slice(-120);
        });
        return next;
      });
    }

    /**
     * Normalize the server payload — server sends { prices: [...] }.
     */
    function handlePayload(payload) {
      if (Array.isArray(payload)) {
        mergeIncoming(payload);
      } else if (payload?.prices) {
        mergeIncoming(payload.prices);
      }
    }

    function handleConnect() {
      setConnectionState('connected');
      // Subscribe once — server sends all 6 coins in one batch
      socket.emit('market:subscribe');
    }

    function handleDisconnect() {
      setConnectionState('disconnected');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('market:prices', handlePayload);
    socket.on('market:tick', handlePayload);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.emit('market:unsubscribe');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('market:prices', handlePayload);
      socket.off('market:tick', handlePayload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear flash indicators after 700ms
  useEffect(() => {
    if (Object.keys(flashes).length === 0) return;
    const id = window.setTimeout(() => setFlashes({}), 700);
    return () => window.clearTimeout(id);
  }, [flashes]);

  // Return prices in the original order of initialCoins
  const orderedPrices = useMemo(
    () =>
      initialCoins.map((coin) => {
        const sym = typeof coin === 'string' ? coin : coin.symbol;
        const base = typeof coin === 'string' ? { symbol: sym } : coin;
        return { ...base, ...prices[sym] };
      }),
    [initialCoins, prices]
  );

  return { prices: orderedPrices, flashes, connectionState, series };
}
