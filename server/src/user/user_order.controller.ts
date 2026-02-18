import { FastifyRequest } from "fastify";
import {
  deleteOrder,
  getOrder,
  getOrdersForUser,
  updateOrder,
} from "../order/order.service";
import { GetUserParams } from "./user.schema";
import { GetOrderParams, UpdateOrderRequestBody } from "../order/order.schema";

export async function getUserOrdersHandler(
  req: FastifyRequest<{
    Params: GetUserParams;
  }>,
) {
  return getOrdersForUser(req.params.userId);
}

export async function getUserOrderHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
) {
  return getOrder(req.params.userId);
}

export async function updateUserOrderHandler(
  req: FastifyRequest<{ Params: GetOrderParams; Body: UpdateOrderRequestBody }>,
) {
  return updateOrder(req.params.orderId, req.body);
}

export async function deleteUserOrderHandler(
  req: FastifyRequest<{ Params: GetOrderParams }>,
) {
  await deleteOrder(req.params.orderId);
}
