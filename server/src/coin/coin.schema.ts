import {
  Number as TNum,
  Object as TObj,
  String as TStr,
  Array as TArr,
  Union,
  Null,
  type Static,
  Tuple,
} from "@sinclair/typebox";

import { DateTime, NullableDateTime } from "../types";

// API
export const coinId = TNum();

export const getCoinParams = TObj({
  coinId,
});
export type GetCoinParams = Static<typeof getCoinParams>;

export const getCoinHistoricalDataParams = TObj({
  ...getCoinParams.properties,
  daysAgo: TNum(),
});
export type GetCoinHistoricalDataParams = Static<
  typeof getCoinHistoricalDataParams
>;

export const coin = TObj({
  id: coinId,
  externalId: TStr(),
  name: TStr(),
  displayName: TStr(),
  imageUrl: TStr(),
  description: TStr(),
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: NullableDateTime,
});

const priceInfo = TObj({
  currentPrice: Union([TStr(), Null()]),
  dayHigh: Union([TStr(), Null()]),
  dayLow: Union([TStr(), Null()]),
  change: Union([TStr(), Null()]),
  changePercent: Union([TStr(), Null()]),
});

export const coinResponse = TObj({
  ...coin.properties,
  ...priceInfo.properties,
});
export type CoinResponse = Static<typeof coinResponse>;

export const coinsResponse = TArr(coinResponse);

const historicalData = TArr(Tuple([TNum(), TStr()]));
export const coinHistoricalDataResponse = TObj({
  prices: historicalData,
  marketCaps: historicalData,
  totalVolumes: historicalData,
});
export type CoinHistoricalDataResponse = Static<
  typeof coinHistoricalDataResponse
>;
