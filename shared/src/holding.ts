import {
  Object as TObj,
  Array as TArr,
  Number as TNum,
  type Static,
} from "@sinclair/typebox";

import { userId } from "./user";
import { coinId } from "./coin";
import { DateTime, Decimal, NullableDateTime } from "./scalars";

export const holdingId = TNum();

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
export type HoldingResponse = Static<typeof holdingResponse>;

export const holdingsResponse = TArr(holdingResponse);
