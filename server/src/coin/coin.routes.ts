import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";

import {
  getCoinsHandler,
  getCoinHandler,
  getCoinHistoricalDataHandler,
} from "./coin.controller";
import {
  coinsResponse,
  getCoinParams,
  coinResponse,
  getCoinHistoricalDataParams,
  coinHistoricalDataResponse,
} from "./coin.schema";

export default function (f: FastifyInstance) {
  f.get(
    "/",
    {
      schema: {
        response: {
          ...errorResponseSchemas,
          200: coinsResponse,
        },
      },
    },
    getCoinsHandler,
  );

  f.get(
    "/:coinId",
    {
      schema: {
        params: getCoinParams,
        response: {
          ...errorResponseSchemas,
          200: coinResponse,
        },
      },
    },
    getCoinHandler,
  );

  f.get(
    "/:coinId/historical/:daysAgo",
    {
      schema: {
        params: getCoinHistoricalDataParams,
        response: {
          ...errorResponseSchemas,
          200: coinHistoricalDataResponse,
        },
      },
    },
    getCoinHistoricalDataHandler,
  );
}
