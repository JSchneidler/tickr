import { FastifyRequest } from "fastify";

import { getCoin, getCoinHistoricalData, getCoins } from "./coin.service";
import { GetCoinHistoricalDataParams, GetCoinParams } from "./coin.schema";

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
