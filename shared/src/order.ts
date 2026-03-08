import {
  Object as TObj,
  Number as TNum,
  Array as TArr,
  Enum,
  Pick,
  Boolean,
  Optional,
  type Static,
} from "@sinclair/typebox";

import { userId } from "./user";
import { coinId } from "./coin";
import {
  DateTime,
  Decimal,
  NullableDateTime,
  NullableDecimal,
} from "./scalars";
import { OrderDirection, OrderType } from "./enums";

export const orderId = TNum();

export const createOrderRequestBody = TObj({
  coinId,
  shares: Optional(Decimal),
  cost: Optional(Decimal),
  target_price: Optional(Decimal),
  direction: Enum(OrderDirection),
  type: Enum(OrderType),
});
export type CreateOrderRequestBody = Static<typeof createOrderRequestBody>;

export const updateOrderRequestBody = Pick(createOrderRequestBody, [
  "shares",
  "cost",
  "target_price",
  "type",
]);
export type UpdateOrderRequestBody = Static<typeof updateOrderRequestBody>;

export const orderResponse = TObj({
  ...createOrderRequestBody.properties,
  id: orderId,
  userId,
  filled: Boolean(),
  shares: NullableDecimal,
  shares_filled: NullableDecimal,
  cost: NullableDecimal,
  cost_filled: NullableDecimal,
  target_price: NullableDecimal,
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: NullableDateTime,
});
export type OrderResponse = Static<typeof orderResponse>;

export const ordersResponse = TArr(orderResponse);
