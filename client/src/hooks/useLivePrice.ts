import { useMemo } from "react";
import Decimal from "decimal.js";

import { useGetCoinQuery } from "../store/api";
import { useAppSelector } from "../store/hooks";
import { selectById } from "../store/livePrices";
import { skipToken } from "@reduxjs/toolkit/query";

export function useLivePrice(coinId?: number) {
  const { data: coin } = useGetCoinQuery(coinId ?? skipToken);
  const livePrice = useAppSelector((state) => {
    if (!coinId) return;
    return selectById(state, coinId);
  });

  return useMemo(() => {
    let price = undefined;
    let change = undefined;
    let changePercent = undefined;
    if (coin && livePrice) {
      price = livePrice.price ? livePrice.price : coin.currentPrice;
      change = new Decimal(price).sub(coin.dayLow).toDecimalPlaces(2); // TODO: Add 24h ago field
      changePercent = change.div(coin.dayLow).mul(100).toDecimalPlaces(2);
    }

    return {
      price: price?.toString(),
      change: change?.toString(),
      changePercent: changePercent?.toString(),
    };
  }, [coin, livePrice]);
}
