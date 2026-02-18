import { Prisma, Coin } from "../generated/prisma/client";

import db from "../db";
import { CoinHistoricalDataResponse, CoinResponse } from "./coin.schema";
import {
  CoinOHLC,
  getHistoricalData,
  getOHLC,
  getPrice,
} from "../apis/coingecko_api";

function calculateChange(open: number, current: number) {
  return new Prisma.Decimal(current).sub(open).toDecimalPlaces(2).toString();
}

function calculateChangePercent(open: number, current: number) {
  return new Prisma.Decimal(current)
    .sub(open)
    .div(open)
    .mul(100)
    .toDecimalPlaces(2)
    .toString();
}

export async function createCoin(
  coinInput: Prisma.CoinCreateInput,
): Promise<Coin> {
  return db.coin.create({
    data: coinInput,
  });
}

export async function getCoins(): Promise<CoinResponse[]> {
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

export async function getCoin(id: number): Promise<CoinResponse> {
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

export async function getCoinHistoricalData(
  coinId: number,
  daysAgo = 1,
): Promise<CoinHistoricalDataResponse> {
  const coin = await db.coin.findUniqueOrThrow({ where: { id: coinId } });

  return getHistoricalData(coin.externalId, daysAgo);
}

export async function updateCoin(
  id: number,
  coinUpdates: Prisma.CoinUpdateInput,
): Promise<Coin> {
  return db.coin.update({ where: { id }, data: coinUpdates });
}

export async function deleteCoin(id: number): Promise<void> {
  await db.coin.delete({ where: { id } });
}
