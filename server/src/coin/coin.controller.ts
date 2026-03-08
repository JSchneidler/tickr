import type { FastifyRequest } from "fastify";

import {
  getCoin,
  getCoinHistoricalData,
  getCoinOHLCData,
  getCoins,
} from "./coin.service";
import type {
  GetCoinHistoricalDataParams,
  GetCoinOHLCDataParams,
  GetCoinParams,
} from "./coin.schema";

export async function getCoinsHandler() {
  return getCoins();
}

export async function getCoinHandler(
  req: FastifyRequest<{ Params: GetCoinParams }>,
) {
  return getCoin(req.params.coinId);
}

export async function getCoinHistoricalDataHandler(
  req: FastifyRequest<{ Params: GetCoinHistoricalDataParams }>,
) {
  return getCoinHistoricalData(req.params.coinId, req.params.daysAgo);
}

export async function getCoinOHLCDataHandler(
  req: FastifyRequest<{ Params: GetCoinOHLCDataParams }>,
) {
  return getCoinOHLCData(req.params.coinId, req.params.daysAgo);
}
