import { FastifyRequest } from "fastify";

import {
  getHoldingsForUser,
  getHolding,
  updateHolding,
  deleteHolding,
} from "../holding/holding.service";
import { GetUserParams } from "./user.schema";
import {
  GetHoldingParams,
  UpdateHoldingRequestBody,
} from "../holding/holding.schema";

export async function getUserHoldingsHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
) {
  return getHoldingsForUser(req.params.userId);
}

export async function getUserHoldingHandler(
  req: FastifyRequest<{ Params: GetHoldingParams }>,
) {
  return getHolding(req.params.holdingId);
}

export async function updateUserHoldingHandler(
  req: FastifyRequest<{
    Params: GetHoldingParams;
    Body: UpdateHoldingRequestBody;
  }>,
) {
  return updateHolding(req.params.holdingId, req.body);
}

export async function deleteUserHoldingHandler(
  req: FastifyRequest<{ Params: GetHoldingParams }>,
) {
  await deleteHolding(req.params.holdingId);
}
