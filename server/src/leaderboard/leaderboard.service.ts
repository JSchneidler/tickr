import { Prisma } from "../generated/prisma/client";
import { type LeaderboardEntry } from "@tickr/shared";

import db from "../db";
import tradeFeed from "../apis/tradeFeed";

export async function computeLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      balance: true,
      Holdings: {
        where: { deletedAt: null },
        select: { coinId: true, shares: true },
      },
    },
  });

  const prices = tradeFeed.getLastPrices();
  const priceMap = new Map(prices.map((p) => [p.coinId, p.price]));

  const entries = users.map((user) => {
    let total = new Prisma.Decimal(user.balance);

    for (const holding of user.Holdings) {
      const price = priceMap.get(holding.coinId);
      if (price) {
        total = total.add(new Prisma.Decimal(price).mul(holding.shares));
      }
    }

    return {
      userId: user.id,
      name: user.name,
      portfolioValue: total.toFixed(2),
      rank: 0,
    };
  });

  entries.sort((a, b) =>
    new Prisma.Decimal(b.portfolioValue).comparedTo(a.portfolioValue),
  );

  entries.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  return entries;
}
