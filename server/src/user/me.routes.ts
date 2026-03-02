import type { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";
import {
  userResponse,
  holdingsResponse,
  tokenResponse,
  tokensResponse,
  ordersResponse,
} from "@tickr/shared";
import {
  getMeHandler,
  getMyTokensHandler,
  getMyTokenHandler,
  getMyHoldingsHandler,
  getMyOrdersHandler,
} from "./me.controller";
import { authenticate } from "../auth";

export default function (f: FastifyInstance) {
  f.get(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: userResponse,
        },
      },
    },
    getMeHandler,
  );

  f.get(
    "/tokens",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: tokensResponse,
        },
      },
    },
    getMyTokensHandler,
  );
  f.get(
    "/tokens/:tokenId",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: tokenResponse,
        },
      },
    },
    getMyTokenHandler,
  );

  f.get(
    "/holdings",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: holdingsResponse,
        },
      },
    },
    getMyHoldingsHandler,
  );

  // f.get(
  //   "/holdings/:holdingId",
  //   {
  //     preHandler: [authenticate],
  //     schema: {
  //       response: {
  //         ...errorResponseSchemas,
  //         200: holdingResponse,
  //       },
  //     },
  //   },
  //   getMyHoldingHandler,
  // );

  f.get(
    "/orders",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: ordersResponse,
        },
      },
    },
    getMyOrdersHandler,
  );

  // f.get(
  //   "/orders/:orderId",
  //   {
  //     preHandler: [authenticate],
  //     schema: {
  //       response: {
  //         ...errorResponseSchemas,
  //         200: orderResponse,
  //       },
  //     },
  //   },
  //   getMyOrderHandler,
  // );
}
