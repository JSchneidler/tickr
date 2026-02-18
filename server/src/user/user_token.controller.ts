import { FastifyRequest } from "fastify";
import { GetUserParams } from "./user.schema";
import {
  getToken,
  getTokensForUser,
  revokeToken,
} from "../token/token.service";
import { GetTokenParams } from "../token/token.schema";

export async function getUserTokensHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
) {
  return getTokensForUser(req.params.userId);
}

export async function getUserTokenHandler(
  req: FastifyRequest<{ Params: GetTokenParams }>,
) {
  return getToken(req.params.tokenId);
}

export async function revokeUserTokenHandler(
  req: FastifyRequest<{ Params: GetTokenParams }>,
) {
  await revokeToken(req.params.tokenId);
}
