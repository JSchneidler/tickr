import { FastifyInstance } from "fastify";

import { errorResponseSchemas } from "../error_responses.schema";

import {
  createOrderHandler,
  getOrdersHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
} from "./order.controller";
import {
  createOrderRequestBody,
  getOrderParams,
  orderResponse,
  ordersResponse,
  updateOrderRequestBody,
} from "./order.schema";
import { authenticate, requireAdmin } from "../auth";

export default function (f: FastifyInstance) {
  f.post(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        body: createOrderRequestBody,
        response: {
          ...errorResponseSchemas,
          201: orderResponse,
        },
      },
    },
    createOrderHandler,
  );

  f.get(
    "/",
    {
      onRequest: [requireAdmin],
      schema: {
        response: {
          ...errorResponseSchemas,
          200: ordersResponse,
        },
      },
    },
    getOrdersHandler,
  );

  f.get(
    "/:orderId",
    {
      onRequest: [requireAdmin],
      schema: {
        params: getOrderParams,
        response: {
          ...errorResponseSchemas,
          200: orderResponse,
        },
      },
    },
    getOrderHandler,
  );

  f.patch(
    "/:orderId",
    {
      onRequest: [authenticate],
      schema: {
        params: getOrderParams,
        body: updateOrderRequestBody,
        response: {
          ...errorResponseSchemas,
          200: orderResponse,
        },
      },
    },
    updateOrderHandler,
  );

  f.delete(
    "/:orderId",
    {
      onRequest: [authenticate],
      schema: {
        params: getOrderParams,
        response: {
          ...errorResponseSchemas,
        },
      },
    },
    deleteOrderHandler,
  );
}
