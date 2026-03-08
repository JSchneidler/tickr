import Decimal from "decimal.js";

import { selectHoldingForCoin } from "../../store/selectors";
import { useGetMyHoldingsQuery } from "../../store/api";
import { Group, Stack, Text } from "@mantine/core";
import Dollars from "../Dollars";
import { useLivePrice } from "../../hooks/useLivePrice.ts";
import Gain from "../Gain.tsx";

interface HoldingProps {
  coinId?: number;
}

function Holding({ coinId }: HoldingProps) {
  const { price } = useLivePrice(coinId);

  const { holding } = useGetMyHoldingsQuery(undefined, {
    selectFromResult: (result) => ({
      holding: selectHoldingForCoin(result, coinId),
    }),
  });

  if (!holding) {
    return (
      <Text c="dimmed" size="sm" ta="center">
        No holdings
      </Text>
    );
  }

  const marketValue = new Decimal(holding.shares).mul(price ?? 0);
  const change = marketValue.sub(holding.cost);
  const changePercent = change.div(holding.cost);

  const shareCount = new Decimal(holding.shares).toNumber();
  const shareLabel = shareCount === 1 ? "share" : "shares";

  return (
    <Group justify="space-between" grow>
      <Stack gap={2} align="center">
        <Text size="xs" c="dimmed">
          Shares
        </Text>
        <Text size="sm" fw={500}>
          {holding.shares} {shareLabel}
        </Text>
      </Stack>
      <Stack gap={2} align="center">
        <Text size="xs" c="dimmed">
          Market Value
        </Text>
        <span>
          <Gain
            change={change.toString()}
            changePercent={changePercent.toString()}
          />
          <Dollars value={marketValue.toString()} size="sm" fw={500} />
        </span>
      </Stack>
      <Stack gap={2} align="center">
        <Text size="xs" c="dimmed">
          Cost Basis
        </Text>
        <Dollars value={holding.cost} size="sm" fw={500} />
      </Stack>
    </Group>
  );
}

export default Holding;
