import { Prisma } from "../generated/prisma/client";

import "../env";
import db from "../db";
import { getCoinData } from "../apis/coingecko_api";
import { SUPPORTED_COINS } from "./supported_coins";
import logger from "../logger";

async function fetchCoins() {
  const coins: Prisma.CoinCreateInput[] = [];

  for (const coin of SUPPORTED_COINS) {
    const coinData = await getCoinData(coin.externalId);
    coins.push({
      ...coin,
      name: coinData.symbol.toUpperCase(),
      description: coinData.description.en,
      imageUrl: coinData.image.large,
    });
  }

  await db.coin.createMany({
    data: coins,
  });

  logger.info(`Registered ${coins.length.toString()} coins`);
}

void fetchCoins();
