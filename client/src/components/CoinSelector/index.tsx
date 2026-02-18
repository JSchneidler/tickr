import { useState } from "react";
import {
  Group,
  Image,
  ScrollArea,
  SegmentedControl,
  Stack,
  Title,
} from "@mantine/core";

import { useGetCoinQuery, useGetCoinsQuery } from "../../store/api";
import Dollars from "../Dollars";
import Gain from "../Gain";
import { useLivePrice } from "../../hooks/useLivePrice";

export type OnCoinSelect = (coinId: string) => void;

interface CoinProps {
  coinId: number;
}

function Coin({ coinId }: CoinProps) {
  const { data: coin } = useGetCoinQuery(coinId);
  const { price, change, changePercent } = useLivePrice(coinId);

  if (!coin) return;

  return (
    <Stack>
      <Group justify="center" wrap="nowrap">
        <Image src={coin.imageUrl} h={25} />
        <Title order={4} fw="normal">
          {coin.displayName}
        </Title>
      </Group>
      <Title order={5}>
        <Dollars value={price} size="xl" fw="bolder" />
        <Gain change={change} changePercent={changePercent} />
      </Title>
    </Stack>
  );
}

interface CoinSelectorProps {
  onCoinSelect: OnCoinSelect;
}

function CoinSelector({ onCoinSelect }: CoinSelectorProps) {
  const { data: coins = [] } = useGetCoinsQuery();
  const [value, setValue] = useState<string>();

  const data = coins.map((coin) => ({
    label: <Coin coinId={coin.id} />,
    value: coin.id.toString(),
  }));

  const onChange = (value: string) => {
    setValue(value);
    onCoinSelect(value);
  };

  return (
    <ScrollArea>
      <SegmentedControl
        data={data}
        value={value}
        onChange={onChange}
        fullWidth
      />
    </ScrollArea>
  );
}

export default CoinSelector;
