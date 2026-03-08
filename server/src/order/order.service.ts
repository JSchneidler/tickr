import {
  OrderDirection as PrismaOrderDirection,
  Prisma,
} from "../generated/prisma/client";

import db from "../db";
import tradeEngine from "../tradeEngine";
import { type CreateOrderRequestBody, OrderDirection } from "@tickr/shared";
import { getCoin } from "../coin/coin.service";

export async function createOrder(
  orderInput: CreateOrderRequestBody,
  userId: number,
) {
  const { coinId, ...orderData } = orderInput;
  const coin = await getCoin(coinId);

  if (orderInput.direction === OrderDirection.SELL) {
    const sharesBeingSoldAgg = await db.order.aggregate({
      _sum: {
        shares: true,
      },
      where: {
        userId,
        coinId: coin.id,
        filled: false,
        direction: PrismaOrderDirection.SELL,
      },
    });

    const holding = await db.holding.findUniqueOrThrow({
      where: { userId_coinId: { userId, coinId: coin.id } },
    });

    if (
      orderInput.shares &&
      holding.shares.lessThan(
        sharesBeingSoldAgg._sum.shares
          ? sharesBeingSoldAgg._sum.shares.add(orderInput.shares)
          : new Prisma.Decimal(orderInput.shares),
      )
    )
      throw new Error("Insufficient shares in holding");
  }

  const order = await db.order.create({
    data: {
      ...orderData,
      User: { connect: { id: userId } },
      Coin: { connect: { id: coin.id } },
    },
  });

  tradeEngine.addOrder(order, coin);

  return order;
}

export async function getOrders() {
  return db.order.findMany({ where: { filled: false } });
}

export async function getOrdersForUser(userId: number) {
  return db.order.findMany({ where: { userId, filled: false } });
}

export async function getOrder(id: number) {
  return db.order.findUniqueOrThrow({ where: { id } });
}

export async function updateOrder(id: number, data: Prisma.OrderUpdateInput) {
  return db.order.update({ where: { id }, data });
}

export async function deleteOrder(id: number) {
  const order = await db.order.delete({ where: { id } });

  const coin = await getCoin(order.coinId);
  tradeEngine.removeOrder(order, coin);
}
