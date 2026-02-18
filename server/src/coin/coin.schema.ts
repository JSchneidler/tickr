import { Number as TNum, Object as TObj, type Static } from "@sinclair/typebox";

import { coinId } from "@tickr/shared";

// API
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
