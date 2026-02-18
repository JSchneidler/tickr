import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";

import {
  createTokenHandler,
  getTokensHandler,
  getTokenHandler,
  revokeTokenHandler,
} from "./token.controller";
import {
  createTokenRequestBody,
  getTokenParams,
  tokenResponse,
  tokensResponse,
} from "./token.schema";
import { authenticate, requireAdmin } from "../auth";

export default function (f: FastifyInstance) {
  f.post(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        body: createTokenRequestBody,
        response: {
          ...errorResponseSchemas,
          201: tokenResponse,
        },
      },
    },
    createTokenHandler,
  );

  f.get(
    "/",
    {
      onRequest: [requireAdmin],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: tokensResponse,
        },
      },
    },
    getTokensHandler,
  );

  f.get(
    "/:tokenId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getTokenParams,
        response: {
          ...errorResponseSchemas,
          200: tokensResponse,
        },
      },
    },
    getTokenHandler,
  );

  f.delete(
    "/:tokenId",
    {
      onRequest: [authenticate],
      schema: {
        params: getTokenParams,
        response: {
          ...errorResponseSchemas,
        },
      },
    },
    revokeTokenHandler,
  );
}
