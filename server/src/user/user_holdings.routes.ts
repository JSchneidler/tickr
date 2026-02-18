import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";
import {
  getHoldingParams,
  holdingResponse,
  holdingsResponse,
  updateHoldingRequestBody,
} from "../holding/holding.schema";
import {
  deleteUserHoldingHandler,
  getUserHoldingHandler,
  getUserHoldingsHandler,
  updateUserHoldingHandler,
} from "./user_holdings.controller";
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
    getUserHoldingsHandler,
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
    getUserHoldingHandler,
  );

  f.patch(
    "/:holdingId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getHoldingParams,
        body: updateHoldingRequestBody,
        response: {
          ...errorResponseSchemas,
          200: holdingResponse,
        },
      },
    },
    updateUserHoldingHandler,
  );

  f.delete(
    "/:holdingId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getHoldingParams,
        response: {
          ...errorResponseSchemas,
        },
      },
    },
    deleteUserHoldingHandler,
  );
}
