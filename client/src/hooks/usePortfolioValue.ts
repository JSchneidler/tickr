import { useMemo } from "react";
import Decimal from "decimal.js";

import {
  useGetCoinsQuery,
  useGetMyHoldingsQuery,
  useMeQuery,
} from "../store/api";
import { useAppSelector } from "../store/hooks";
import { selectEntities } from "../store/livePrices";

export function usePortfolioValue() {
  const { data: user } = useMeQuery();
  const { data: coins = [] } = useGetCoinsQuery(undefined, { skip: !user });
  const { data: holdings = [] } = useGetMyHoldingsQuery(undefined, {
    skip: !user,
  });
  const livePrices = useAppSelector(selectEntities);

  return useMemo(() => {
    if (!user) return;

    let value = new Decimal(user.balance);
    for (const holding of holdings) {
      let price = "0";
      if (livePrices[holding.coinId])
        price = livePrices[holding.coinId]!.price; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      else {
        const coin = coins.find((coin) => coin.id === holding.coinId);
        if (coin) price = coin.currentPrice;
      }
      const holdingValue = new Decimal(holding.shares).mul(price);

      value = value.add(holdingValue);
    }

    value = value.toDecimalPlaces(2);
    const change = value.sub(user.deposits);
    const changePercent = change.div(user.deposits).mul(100);
    return {
      value: value.toString(),
      change: change.toString(),
      changePercent: changePercent.toString(),
    };
  }, [user, coins, holdings, livePrices]);
}
