import { Prisma } from "../generated/prisma/client";

import db from "../db";
import {
  type CoinOHLC,
  getHistoricalData,
  getOHLC,
  getOHLCHistory,
  getPrice,
} from "../apis/coingecko_api";

function calculateChange(open: number, current: number) {
  return new Prisma.Decimal(current).sub(open).toFixed(2);
}

function calculateChangePercent(open: number, current: number) {
  return new Prisma.Decimal(current).sub(open).div(open).mul(100).toFixed(2);
}

export async function getCoins() {
  const coins = await db.coin.findMany({ take: 100 });

  const promises: Promise<CoinOHLC | string>[] = [];

  for (const coin of coins) {
    promises.push(getPrice(coin.externalId));
    promises.push(getOHLC(coin.externalId));
  }
  const responses = await Promise.all(promises);

  return coins.map((coin, i) => {
    const currentPrice = responses[i * 2] as string;
    const ohlc = responses[i * 2 + 1] as CoinOHLC;
    return {
      ...coin,
      currentPrice,
      dayHigh: ohlc.dayHigh.toString(),
      dayLow: ohlc.dayLow.toString(),
      change: calculateChange(ohlc.open, +currentPrice),
      changePercent: calculateChangePercent(ohlc.open, +currentPrice),
    };
  });
}

export async function getCoin(id: number) {
  const coin = await db.coin.findUniqueOrThrow({ where: { id } });

  const ohlc = await getOHLC(coin.externalId);
  const currentPrice = await getPrice(coin.externalId);

  return {
    ...coin,
    currentPrice,
    dayHigh: ohlc.dayHigh.toString(),
    dayLow: ohlc.dayLow.toString(),
    change: calculateChange(ohlc.open, +currentPrice),
    changePercent: calculateChangePercent(ohlc.open, +currentPrice),
  };
}

export async function getCoinHistoricalData(coinId: number, daysAgo = 1) {
  const coin = await db.coin.findUniqueOrThrow({ where: { id: coinId } });

  return getHistoricalData(coin.externalId, daysAgo);
}

export async function getCoinOHLCData(coinId: number, daysAgo = 1) {
  const coin = await db.coin.findUniqueOrThrow({ where: { id: coinId } });
  const ohlc = await getOHLCHistory(coin.externalId, daysAgo);

  return { ohlc };
}
