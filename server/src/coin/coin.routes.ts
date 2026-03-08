import type { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";

import {
  getCoinsHandler,
  getCoinHandler,
  getCoinHistoricalDataHandler,
  getCoinOHLCDataHandler,
} from "./coin.controller";
import {
  coinsResponse,
  coinResponse,
  coinHistoricalDataResponse,
  coinOHLCDataResponse,
} from "@tickr/shared";
import {
  getCoinParams,
  getCoinHistoricalDataParams,
  getCoinOHLCDataParams,
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

  f.get(
    "/:coinId/ohlc/:daysAgo",
    {
      schema: {
        params: getCoinOHLCDataParams,
        response: {
          ...errorResponseSchemas,
          200: coinOHLCDataResponse,
        },
      },
    },
    getCoinOHLCDataHandler,
  );
}
