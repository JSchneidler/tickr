import { FastifyRequest } from "fastify";

import { createToken, getToken, getTokens, revokeToken } from "./token.service";
import { CreateTokenRequestBody, GetTokenParams } from "./token.schema";
import { getAuthUser } from "../auth";

export async function createTokenHandler(
  req: FastifyRequest<{ Body: CreateTokenRequestBody }>,
) {
  return createToken(req.body.name, getAuthUser(req));
}

export async function getTokensHandler() {
  return getTokens();
}

export async function getTokenHandler(
  req: FastifyRequest<{ Params: GetTokenParams }>,
) {
  return getToken(req.params.tokenId);
}

export async function revokeTokenHandler(
  req: FastifyRequest<{ Params: GetTokenParams }>,
) {
  await revokeToken(req.params.tokenId);
}
