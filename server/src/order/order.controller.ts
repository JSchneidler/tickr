import type { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "../generated/prisma/client";

import {
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  createOrder,
} from "./order.service";

import {
  type CreateOrderRequestBody,
  type UpdateOrderRequestBody,
} from "@tickr/shared";
import { type GetOrderParams } from "./order.schema";
import { getAuthUser } from "../auth";

export async function createOrderHandler(
  req: FastifyRequest<{ Body: CreateOrderRequestBody }>,
  rep: FastifyReply,
) {
  if (req.body.shares || req.body.cost)
    return createOrder(req.body, getAuthUser(req).id);
  else rep.code(400).send("Must specify shares or cost");
}

export async function getOrdersHandler() {
  return getOrders();
}

export async function getOrderHandler(
  req: FastifyRequest<{ Params: GetOrderParams }>,
) {
  return getOrder(req.params.orderId);
}

export async function updateOrderHandler(
  req: FastifyRequest<{ Params: GetOrderParams; Body: UpdateOrderRequestBody }>,
  rep: FastifyReply,
) {
  const user = getAuthUser(req);
  const order = await getOrder(req.params.orderId);

  if (user.id === order.userId || user.role === Role.ADMIN)
    return updateOrder(req.params.orderId, req.body);
  else rep.code(403).send("Insufficient permission");
}

export async function deleteOrderHandler(
  req: FastifyRequest<{ Params: GetOrderParams }>,
  rep: FastifyReply,
) {
  const user = getAuthUser(req);
  const order = await getOrder(req.params.orderId);

  if (user.id === order.userId || user.role === Role.ADMIN) {
    await deleteOrder(req.params.orderId);
  } else rep.code(403).send("Insufficient permission");
}
