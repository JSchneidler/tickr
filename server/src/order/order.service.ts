import { OrderDirection, Prisma } from "../generated/prisma/client";

import db from "../db";
import tradeEngine from "../tradeEngine";
import { OrderCreateInput } from "./order.schema";
import { getCoin } from "../coin/coin.service";

export async function createOrder(
  orderInput: OrderCreateInput,
  userId: number,
  coinId: number,
) {
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
        direction: OrderDirection.SELL,
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

  // return createOrder(order, req.user);
  const order = await db.order.create({
    data: {
      ...orderInput,
      User: { connect: { id: userId } },
      Coin: { connect: { id: coin.id } },
    },
  });

  tradeEngine.addOrder(order, coin);

  return order;
}

export async function getOrders() {
  return db.order.findMany();
}

export async function getOrdersForUser(userId: number) {
  return db.order.findMany({ where: { userId } });
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
