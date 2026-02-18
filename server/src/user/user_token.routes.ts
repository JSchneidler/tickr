import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";
import {
  getTokenParams,
  tokenResponse,
  tokensResponse,
} from "../token/token.schema";
import {
  getUserTokenHandler,
  getUserTokensHandler,
  revokeUserTokenHandler,
} from "./user_token.controller";
import { requireAdmin } from "../auth";

export default function (f: FastifyInstance) {
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
    getUserTokensHandler,
  );

  f.get(
    "/:tokenId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getTokenParams,
        response: {
          ...errorResponseSchemas,
          200: tokenResponse,
        },
      },
    },
    getUserTokenHandler,
  );

  f.delete(
    "/:tokenId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getTokenParams,
        response: {
          ...errorResponseSchemas,
        },
      },
    },
    revokeUserTokenHandler,
  );
}
