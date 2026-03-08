import { Object as TObj, type Static } from "@sinclair/typebox";

import { orderId } from "@tickr/shared";

// API
export const getOrderParams = TObj({
  orderId,
});
export type GetOrderParams = Static<typeof getOrderParams>;
