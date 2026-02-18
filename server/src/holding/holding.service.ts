import { Prisma } from "../generated/prisma/client";

import db from "../db";
import { UserWithoutSensitive } from "../user/user.schema";

export async function createHolding(
  holdingInput: Prisma.HoldingCreateInput,
  user: UserWithoutSensitive,
  coinId: number,
) {
  return db.holding.create({
    data: {
      ...holdingInput,
      User: { connect: { id: user.id } },
      Coin: { connect: { id: coinId } },
    },
  });
}

export async function getHoldings() {
  return db.holding.findMany();
}

export async function getHoldingsForUser(userId: number) {
  return db.holding.findMany({ where: { userId } });
}

export async function getHolding(id: number) {
  return db.holding.findUniqueOrThrow({ where: { id } });
}

export async function updateHolding(
  id: number,
  holdingUpdates: Prisma.HoldingUpdateInput,
) {
  return db.holding.update({ where: { id }, data: holdingUpdates });
}

export async function deleteHolding(id: number) {
  return db.holding.delete({ where: { id } });
}
