import { useState, useEffect } from "react";
import {
  Group,
  Image,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
  Paper,
} from "@mantine/core";

import { useGetCoinQuery, useGetCoinsQuery } from "../../store/api";
import Dollars from "../Dollars";
import Gain from "../Gain";
import { useLivePrice } from "../../hooks/useLivePrice";

export type OnCoinSelect = (coinId: string) => void;

interface CoinProps {
  coinId: number;
  selected: boolean;
  onClick: () => void;
}

function Coin({ coinId, selected, onClick }: CoinProps) {
  const { data: coin } = useGetCoinQuery(coinId);
  const { price, change, changePercent } = useLivePrice(coinId);

  if (!coin) return null;

  return (
    <UnstyledButton onClick={onClick} style={{ width: "100%", height: "100%" }}>
      <Paper
        p="sm"
        withBorder
        style={{
          borderColor: selected ? "var(--mantine-color-green-6)" : undefined,
          backgroundColor: selected
            ? "var(--mantine-color-green-light)"
            : undefined,
          width: "100%",
          cursor: "pointer",
        }}
      >
        <Stack gap={4}>
          <Group gap="xs" wrap="nowrap">
            <Image src={coin.imageUrl} h={25} w={25} fit="contain" />
            <Text fw={500} size="sm" truncate>
              {coin.displayName}
            </Text>
          </Group>
          <Dollars value={price} size="sm" fw="bold" />
          <Gain change={change} changePercent={changePercent} />
        </Stack>
      </Paper>
    </UnstyledButton>
  );
}

interface CoinSelectorProps {
  onCoinSelect: OnCoinSelect;
}

function CoinSelector({ onCoinSelect }: CoinSelectorProps) {
  const { data: coins = [] } = useGetCoinsQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const effectiveSelected = selected ?? coins[0]?.id.toString() ?? "";

  // Select first coin on page load
  useEffect(() => {
    const firstId = coins[0]?.id.toString();
    if (firstId && selected === null) {
      onCoinSelect(firstId);
    }
  }, [coins, selected, onCoinSelect]);

  return (
    <ScrollArea mb="lg">
      <Group gap="sm" wrap="nowrap" grow>
        {coins.map((coin) => (
          <Coin
            key={coin.id}
            coinId={coin.id}
            selected={effectiveSelected === coin.id.toString()}
            onClick={() => {
              const id = coin.id.toString();
              setSelected(id);
              onCoinSelect(id);
            }}
          />
        ))}
      </Group>
    </ScrollArea>
  );
}

export default CoinSelector;
