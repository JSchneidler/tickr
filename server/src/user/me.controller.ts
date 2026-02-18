import { FastifyRequest } from "fastify";

import { getUser } from "./user.service";
import { getTokensForUser, getToken } from "../token/token.service";
import { GetTokenParams } from "../token/token.schema";
import { getHoldingsForUser } from "../holding/holding.service";
import { getOrdersForUser } from "../order/order.service";
import { getAuthUser } from "../auth";

export async function getMeHandler(req: FastifyRequest) {
  return getUser(getAuthUser(req).id);
}

export async function getMyTokensHandler(req: FastifyRequest) {
  return getTokensForUser(getAuthUser(req).id);
}
export async function getMyTokenHandler(
  req: FastifyRequest<{ Params: GetTokenParams }>,
) {
  return getToken(req.params.tokenId);
}

export async function getMyHoldingsHandler(req: FastifyRequest) {
  return getHoldingsForUser(getAuthUser(req).id);
}
// TODO: Do we need this? If so, bug. getHolding takes holdingId, not userId
// export async function getMyHoldingHandler(
//   req: FastifyRequest<{ Params: GetHoldingParams }>,
// ) {
//   return getHolding(getAuthUser(req).id);
// }

export async function getMyOrdersHandler(req: FastifyRequest) {
  return getOrdersForUser(getAuthUser(req).id);
}
// TODO: Do we need this? If so, bug. getHolding takes holdingId, not userId
// export async function getMyOrderHandler(
//   req: FastifyRequest<{ Params: GetOrderParams }>,
// ) {
//   return getOrder(getAuthUser(req).id);
// }
