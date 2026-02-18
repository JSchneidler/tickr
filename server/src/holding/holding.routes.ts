import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";
import { getHoldingsHandler, getHoldingHandler } from "./holding.controller";
import {
  getHoldingParams,
  holdingResponse,
  holdingsResponse,
} from "./holding.schema";
import { requireAdmin } from "../auth";

export default function (f: FastifyInstance) {
  f.get(
    "/",
    {
      onRequest: [requireAdmin],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: holdingsResponse,
        },
      },
    },
    getHoldingsHandler,
  );

  f.get(
    "/:holdingId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getHoldingParams,
        response: {
          ...errorResponseSchemas,
          200: holdingResponse,
        },
      },
    },
    getHoldingHandler,
  );
}
