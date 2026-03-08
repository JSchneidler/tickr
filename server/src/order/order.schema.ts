import { Prisma } from "../generated/prisma/client";
import { Object as TObj, type Static } from "@sinclair/typebox";

import { orderId } from "@tickr/shared";

// Prisma
export type OrderCreateInput = Omit<
  Prisma.OrderCreateInput,
  "User" | "Coin"
> & {
  // shares?: string | Prisma.Decimal;
  // cost?: string | Prisma.Decimal;
};

// API
export const getOrderParams = TObj({
  orderId,
});
export type GetOrderParams = Static<typeof getOrderParams>;
