import { useMemo, useState } from "react";
import {
  Button,
  SegmentedControl,
  NumberInput,
  Text,
  ActionIcon,
  Center,
  Stack,
} from "@mantine/core";
import Decimal from "decimal.js";

import {
  useCreateOrderMutation,
  useGetCoinQuery,
  useGetMyHoldingsQuery,
  useMeQuery,
} from "../../store/api";
import { OrderDirection, OrderType } from "@tickr/shared";
import Dollars from "../Dollars";
import { selectHoldingForCoin } from "../../store/selectors";
import { skipToken } from "@reduxjs/toolkit/query";

enum QuantityType {
  SHARES,
  MONEY,
}

interface OrdersProps {
  coinId?: number;
}

function TradeForm({ coinId }: OrdersProps) {
  const [quantity, setQuantity] = useState<Decimal>();
  const [limitPrice, setLimitPrice] = useState<Decimal>();
  const [quantityType, setQuantityType] = useState(QuantityType.SHARES);
  const [orderType, setOrderType] = useState(OrderType.MARKET);
  const { data: user } = useMeQuery();
  const { data: coin } = useGetCoinQuery(coinId ?? skipToken);
  const { holding } = useGetMyHoldingsQuery(undefined, {
    selectFromResult: (result) => ({
      holding: selectHoldingForCoin(result, coinId),
    }),
  });
  const [createOrder] = useCreateOrderMutation();

  const cost = useMemo(() => {
    if (!coin || !quantity) return undefined;
    if (quantityType === QuantityType.SHARES)
      return new Decimal(quantity).mul(coin.currentPrice);
    return new Decimal(quantity).div(coin.currentPrice);
  }, [coin, quantity, quantityType]);

  const [buyDisabled, sellDisabled] = useMemo(() => {
    if (orderType === OrderType.LIMIT && !limitPrice) return [true, true];
    if (!cost || !user || !quantity) return [true, true];

    const cst = new Decimal(cost);

    if (quantity.eq(0)) return [true, true];

    if (quantityType === QuantityType.SHARES)
      return [
        quantity.eq(0) || cst.gt(user.balance),
        !holding || quantity.gt(holding.shares),
      ];
    else
      return [
        quantity.eq(0) || quantity.gt(user.balance),
        !holding || cst.gt(holding.shares),
      ];
  }, [orderType, limitPrice, cost, user, quantity, quantityType, holding]);

  function onValueChange(value: string) {
    try {
      const decimal = new Decimal(value);
      setQuantity(decimal);
    } catch {
      setQuantity(undefined);
    }
  }

  function buy() {
    if (coinId && !buyDisabled)
      void createOrder({
        coinId,
        shares:
          quantityType === QuantityType.SHARES
            ? quantity?.toString()
            : undefined,
        cost:
          quantityType === QuantityType.MONEY
            ? quantity?.toString()
            : undefined,
        target_price:
          orderType === OrderType.LIMIT ? limitPrice?.toString() : undefined,
        type: orderType,
        direction: OrderDirection.BUY,
      });
  }

  function sell() {
    if (coinId && !sellDisabled)
      void createOrder({
        coinId,
        shares:
          quantityType === QuantityType.SHARES
            ? quantity?.toString()
            : undefined,
        cost:
          quantityType === QuantityType.MONEY
            ? quantity?.toString()
            : undefined,
        target_price:
          orderType === OrderType.LIMIT ? limitPrice?.toString() : undefined,
        type: orderType,
        direction: OrderDirection.SELL,
      });
  }

  function swapQuantityType() {
    if (quantityType === QuantityType.SHARES)
      setQuantityType(QuantityType.MONEY);
    else setQuantityType(QuantityType.SHARES);
  }

  function sellAllShares() {
    if (holding) {
      setQuantityType(QuantityType.SHARES);
      setQuantity(new Decimal(holding.shares));
    }
  }

  const quantitySwapButton = (
    <ActionIcon onClick={swapQuantityType} variant="subtle">
      {quantityType === QuantityType.SHARES ? "#" : "$"}
    </ActionIcon>
  );

  const allSharesButton = (
    <ActionIcon onClick={sellAllShares} disabled={!holding} variant="default">
      All
    </ActionIcon>
  );

  return (
    <Stack gap="sm">
      <SegmentedControl
        data={[
          { value: OrderType.MARKET, label: "Market" },
          { value: OrderType.LIMIT, label: "Limit" },
        ]}
        value={orderType}
        onChange={(value) => {
          setOrderType(value as OrderType);
        }}
      />
      <NumberInput
        placeholder={
          quantityType === QuantityType.SHARES ? "Shares" : "Total Cost"
        }
        leftSection={quantitySwapButton}
        rightSection={allSharesButton}
        allowNegative={false}
        value={quantity?.toString() ?? ""}
        onValueChange={(values) => {
          onValueChange(values.formattedValue);
        }}
      />
      {orderType === OrderType.LIMIT && (
        <NumberInput
          placeholder="Limit price"
          allowNegative={false}
          onValueChange={(values) => {
            try {
              setLimitPrice(new Decimal(values.formattedValue));
            } catch {
              setLimitPrice(undefined);
            }
          }}
        />
      )}
      <Button.Group w="100%">
        <Button
          disabled={buyDisabled}
          onClick={() => {
            buy();
          }}
          color="green"
          fullWidth
          size="md"
        >
          Buy
        </Button>
        <Button
          disabled={sellDisabled}
          onClick={() => {
            sell();
          }}
          color="red"
          fullWidth
          size="md"
        >
          Sell
        </Button>
      </Button.Group>
      {cost && (
        <Center>
          <Stack gap={0} align="center">
            <Text size="xs" c="dimmed">
              {quantityType === QuantityType.SHARES
                ? "Est. cost"
                : "Est. shares"}
            </Text>
            {quantityType === QuantityType.SHARES && (
              <Dollars value={cost.toString()} />
            )}
            {quantityType === QuantityType.MONEY && (
              <Text>{cost.toString()} shares</Text>
            )}
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

export default TradeForm;
