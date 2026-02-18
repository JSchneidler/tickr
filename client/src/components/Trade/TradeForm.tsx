import { useMemo, useState } from "react";
import {
  Button,
  Group,
  SegmentedControl,
  NumberInput,
  Text,
  ActionIcon,
  Center,
} from "@mantine/core";
import { useField } from "@mantine/form";
import Decimal from "decimal.js";

import {
  useCreateOrderMutation,
  useGetCoinQuery,
  useGetMyHoldingsQuery,
  useMeQuery,
} from "../../store/api";
import { OrderDirection, OrderType } from "../../store/api/schema";
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

  const quantityField = useField<string | undefined>({
    initialValue: undefined,
  });

  const cost = useMemo(() => {
    if (!coin || !quantity) return undefined;
    if (quantityType === QuantityType.SHARES)
      return new Decimal(quantity).mul(coin.currentPrice);
    return new Decimal(quantity).div(coin.currentPrice);
  }, [coin, quantity, quantityType]);

  const [buyDisabled, sellDisabled] = useMemo(() => {
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
  }, [cost, holding, user, quantityType, quantity]);

  function onValueChange(value: string) {
    try {
      const decimal = new Decimal(value);
      setQuantity(decimal);
    } catch {
      setQuantity(undefined);
    }
  }

  function buy() {
    if (coinId)
      void createOrder({
        coinId,
        shares:
          quantityType === QuantityType.SHARES
            ? quantityField.getValue()
            : undefined,
        price:
          quantityType === QuantityType.MONEY
            ? quantityField.getValue()
            : undefined,
        type: OrderType.MARKET,
        direction: OrderDirection.BUY,
      });
  }

  function sell() {
    if (coinId)
      void createOrder({
        coinId,
        shares:
          quantityType === QuantityType.SHARES
            ? quantityField.getValue()
            : undefined,
        price:
          quantityType === QuantityType.MONEY
            ? quantityField.getValue()
            : undefined,
        type: OrderType.MARKET,
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
      quantityField.setValue(holding.shares);
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
    <>
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
        onValueChange={(values) => {
          onValueChange(values.formattedValue);
        }}
        {...quantityField.getInputProps()}
      />
      {orderType === OrderType.LIMIT && (
        <NumberInput placeholder="Limit" allowNegative={false} />
      )}
      <Group>
        <Button.Group w="100%">
          <Button
            disabled={buyDisabled}
            onClick={() => {
              buy();
            }}
            color="green"
            fullWidth
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
          >
            Sell
          </Button>
        </Button.Group>
        {cost && (
          <Center w="100%">
            {quantityType === QuantityType.SHARES && (
              <Dollars value={cost.toString()} />
            )}
            {quantityType === QuantityType.MONEY && (
              <Text>{cost.toString()} shares</Text>
            )}
          </Center>
        )}
      </Group>
    </>
  );
}

export default TradeForm;
