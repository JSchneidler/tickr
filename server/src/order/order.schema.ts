import { OrderDirection, OrderType, Prisma } from "../generated/prisma/client";
import {
  Object as TObj,
  Number as TNum,
  Array as TArr,
  Enum,
  Pick,
  Boolean,
  type Static,
  Optional,
} from "@sinclair/typebox";
import { userId } from "../user/user.schema";
import { coinId } from "../coin/coin.schema";
import { DateTime, Decimal, NullableDateTime, NullableDecimal } from "../types";

// Prisma
export type OrderCreateInput = Omit<
  Prisma.OrderCreateInput,
  "User" | "Coin"
> & {
  shares?: string | Prisma.Decimal;
  price?: string | Prisma.Decimal;
};

// API
export const orderId = TNum();

export const getOrderParams = TObj({
  orderId,
});
export type GetOrderParams = Static<typeof getOrderParams>;

export const createOrderRequestBody = TObj({
  coinId,
  shares: Optional(Decimal),
  price: Optional(Decimal),
  direction: Enum(OrderDirection),
  type: Enum(OrderType),
});
export type CreateOrderRequestBody = Static<typeof createOrderRequestBody>;

export const updateOrderRequestBody = Pick(createOrderRequestBody, [
  "shares",
  "type",
  "price",
]);
export type UpdateOrderRequestBody = Static<typeof updateOrderRequestBody>;

export const orderResponse = TObj({
  ...createOrderRequestBody.properties,
  id: orderId,
  userId,
  filled: Boolean(),
  sharePrice: NullableDecimal, // TODO: Use decimal type?
  totalPrice: NullableDecimal,
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: NullableDateTime,
});
export const ordersResponse = TArr(orderResponse);
