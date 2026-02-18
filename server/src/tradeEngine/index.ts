import {
  Order,
  OrderDirection,
  OrderType,
  Prisma,
  Coin,
} from "../generated/prisma/client";

import db from "../db";
import tradeFeed, { TradesSummary, UnSubFn } from "../apis/tradeFeed";
import { getUser, updateUser } from "../user/user.service";
import { updateOrder } from "../order/order.service";
import { deleteHolding, updateHolding } from "../holding/holding.service";

interface Subscription {
  orders: Order[];
  unsubscribe: UnSubFn;
}

type UserListener = (order: Order) => void;

class TradeEngine {
  private orders = new Map<string, Subscription>();
  private liveUsers = new Map<number, UserListener>();

  async start() {
    const orders = await db.order.findMany({
      where: { filled: false },
      include: { Coin: true },
    });

    for (const order of orders) this.addOrder(order, order.Coin);
  }

  addOrder(order: Order, coin: Coin) {
    const subscription = this.orders.get(coin.name);
    if (subscription) subscription.orders.push(order);
    else {
      this.orders.set(coin.name, {
        orders: [order],
        unsubscribe: tradeFeed.subscribe(coin.name, async (summary) => {
          await this.processOrders(coin, summary);
        }),
      });
    }

    // console.log(
    //   `Registered order ${order.direction}@${order.type} ${order.shares.toString()} of ${coin.name}`
    // );
  }

  removeOrder(order: Order, coin: Coin) {
    const subscription = this.orders.get(coin.name);
    if (subscription) {
      subscription.orders = subscription.orders.filter(
        (o) => o.id !== order.id,
      );

      if (subscription.orders.length === 0) {
        subscription.unsubscribe();
        this.orders.delete(coin.name);
      }
    }
  }

  addLiveUser(userId: number, listener: UserListener) {
    this.liveUsers.set(userId, listener);
  }

  removeLiveUser(userId: number) {
    this.liveUsers.delete(userId);
  }

  private async processOrders(coin: Coin, summary: TradesSummary) {
    // console.log(
    //   `${this.orders.get(coin).orders.length.toString()} ${coin} orders queued`
    // );

    const subscription = this.orders.get(coin.name);
    if (subscription) {
      const orders = subscription.orders;

      await Promise.all([
        this.processMarketOrders(
          orders.filter((order) => order.type === OrderType.MARKET),
          coin,
          summary,
        ),
        this.processLimitOrders(
          orders.filter((order) => order.type === OrderType.LIMIT),
          coin,
          summary,
        ),
      ]);
    }
  }

  private async fillOrder(
    order: Order,
    coin: Coin,
    sharePrice: Prisma.Decimal,
    totalPrice: Prisma.Decimal,
  ) {
    this.removeOrder(order, coin);
    const updatedOrder = await updateOrder(order.id, {
      filled: true,
      sharePrice,
      totalPrice,
    });
    const user = this.liveUsers.get(order.userId);
    if (user) user(updatedOrder);

    // console.log(
    //   `Filled order ${order.id.toString()}: ${order.direction}@${order.type} ${order.shares.toString()} of ${coin.name}(${sharePrice.toString()}). Total: ${totalPrice.toString()}`
    // );
  }

  private async fillBuyOrder(order: Order, coin: Coin, price: Prisma.Decimal) {
    const user = await getUser(order.userId);

    // Either order.shares or order.price must exist
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cost = (
      order.shares ? order.shares.mul(price).toDecimalPlaces(2) : order.price
    )!;
    if (user.balance.lessThan(cost)) return;

    order.shares ??= cost.div(price);

    await this.fillOrder(order, coin, price, cost);

    const where: Prisma.HoldingWhereUniqueInput = {
      userId_coinId: { userId: order.userId, coinId: order.coinId },
    };
    const holding = await db.holding.findUnique({
      where,
    });

    const updates = {
      shares: holding ? holding.shares.add(order.shares) : order.shares,
      cost: holding ? holding.cost.add(cost) : cost,
    };
    await db.holding.upsert({
      where,
      create: { ...updates, coinId: coin.id, userId: order.userId },
      update: updates,
    });

    await updateUser(order.userId, {
      balance: { decrement: cost }, // TODO: Causing precision errors?
    });
  }

  private async fillSellOrder(order: Order, coin: Coin, price: Prisma.Decimal) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const profit = (
      order.shares ? order.shares.mul(price).toDecimalPlaces(2) : order.price
    )!;

    order.shares ??= profit.div(price);

    const where: Prisma.HoldingWhereUniqueInput = {
      userId_coinId: { userId: order.userId, coinId: order.coinId },
    };
    const holding = await db.holding.findUniqueOrThrow({
      where,
    });

    if (holding.shares.lt(order.shares)) return;

    const cost = holding.cost
      .div(holding.shares)
      .mul(order.shares)
      .toDecimalPlaces(2);

    await this.fillOrder(order, coin, price, profit);

    if (holding.shares.equals(order.shares)) await deleteHolding(holding.id);
    else
      await updateHolding(holding.id, {
        shares: { decrement: order.shares },
        cost: { decrement: cost },
      });

    await updateUser(order.userId, {
      balance: { increment: profit }, // TODO: Causing precision errors?
    });
  }

  private async processMarketOrders(
    orders: Order[],
    coin: Coin,
    summary: TradesSummary,
  ) {
    if (orders.length === 0) return;

    for (const order of orders) {
      switch (order.direction) {
        case OrderDirection.BUY:
          await this.fillBuyOrder(order, coin, summary.low);
          break;
        case OrderDirection.SELL:
          await this.fillSellOrder(order, coin, summary.high);
          break;
      }
    }
  }
  private async processLimitOrders(
    orders: Order[],
    coin: Coin,
    summary: TradesSummary,
  ) {
    if (orders.length === 0) return;

    for (const order of orders) {
      const price = order.price!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      switch (order.direction) {
        case OrderDirection.BUY:
          if (summary.low.lte(price))
            await this.fillBuyOrder(order, coin, summary.low);
          break;
        case OrderDirection.SELL:
          if (summary.high.gte(price))
            await this.fillSellOrder(order, coin, summary.high);
          break;
      }
    }
  }
}

export default new TradeEngine();
