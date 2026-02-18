import Decimal from "decimal.js";

import { selectHoldingForCoin } from "../../store/selectors";
import { useGetCoinQuery, useGetMyHoldingsQuery } from "../../store/api";
import { Center, Title } from "@mantine/core";
import Dollars from "../Dollars";
import { skipToken } from "@reduxjs/toolkit/query";

interface HoldingProps {
  coinId?: number;
}

function Holding({ coinId }: HoldingProps) {
  const { data: coin } = useGetCoinQuery(coinId ?? skipToken);

  const { holding } = useGetMyHoldingsQuery(undefined, {
    selectFromResult: (result) => ({
      holding: selectHoldingForCoin(result, coinId),
    }),
  });

  return (
    coin && (
      <Center>
        <Title order={3}>
          {!holding && "No holdings"}
          {holding && (
            <>
              {holding.shares} shares (
              <Dollars
                value={new Decimal(holding.shares)
                  .mul(coin.currentPrice)
                  .toDecimalPlaces(2)
                  .toString()}
              />
              ) at cost average of <Dollars value={holding.cost} />
            </>
          )}
        </Title>
      </Center>
    )
  );
}

export default Holding;
