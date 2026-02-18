import {
  Object as TObj,
  Array as TArr,
  Number as TNum,
  type Static,
} from "@sinclair/typebox";

import { userId } from "../user/user.schema";
import { coinId } from "../coin/coin.schema";
import { DateTime, Decimal, NullableDateTime } from "../types";

// API
export const holdingId = TNum();

export const getHoldingParams = TObj({
  holdingId,
});
export type GetHoldingParams = Static<typeof getHoldingParams>;

export const updateHoldingRequestBody = TObj({
  shares: Decimal,
  cost: Decimal,
});
export type UpdateHoldingRequestBody = Static<typeof updateHoldingRequestBody>;

export const holdingResponse = TObj({
  ...updateHoldingRequestBody.properties,
  id: holdingId,
  userId,
  coinId,
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: NullableDateTime,
});
export const holdingsResponse = TArr(holdingResponse);
