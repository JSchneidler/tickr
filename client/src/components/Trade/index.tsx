import { ReactElement, useState } from "react";
import {
  Title,
  Container,
  Text,
  Stack,
  Group,
  Paper,
  Grid,
} from "@mantine/core";

import CoinSelector from "../CoinSelector";
import { useGetCoinQuery, useMeQuery } from "../../store/api";
import Orders from "./Orders";
import TradeForm from "./TradeForm";
import Chart from "./Chart";
import Dollars from "../Dollars";
import Gain from "../Gain";
import { useLivePrice } from "../../hooks/useLivePrice";
import { skipToken } from "@reduxjs/toolkit/query";
import Holding from "./Holding";

interface InfoProps {
  label: string;
  element: ReactElement;
}

function Info({ label, element }: InfoProps) {
  return (
    <Group justify="space-between">
      <Text>{label}</Text>
      {element}
    </Group>
  );
}

function Trade() {
  const [coinId, setCoinId] = useState<number>();

  const { data: user } = useMeQuery();
  const { data: coin } = useGetCoinQuery(coinId ?? skipToken);
  const { price, change, changePercent } = useLivePrice(coinId);

  return (
    <Container size="xl">
      <CoinSelector
        onCoinSelect={(id) => {
          setCoinId(+id);
        }}
      />
      {coin && (
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              <Paper withBorder p="md">
                <Title order={3} fw="normal" mb={4}>
                  {coin.displayName} ({coin.name})
                </Title>
                <Group align="baseline" gap="xs" mb="sm">
                  <Dollars value={price} size="xl" fw="bolder" />
                  <Gain
                    change={change}
                    changePercent={changePercent}
                    size="md"
                  />
                </Group>
                {coinId && <Chart coinId={coinId} />}
                <Info
                  label="Range"
                  element={
                    <span>
                      {<Dollars value={coin.dayLow} />} –{" "}
                      {<Dollars value={coin.dayHigh} />}
                    </span>
                  }
                />
              </Paper>
              <Text size="sm" c="dimmed">
                {coin.description}
              </Text>
            </Stack>
          </Grid.Col>
          {user && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md">
                <Stack>
                  <TradeForm coinId={coinId} />
                  <Holding coinId={coinId} />
                  <Orders coinId={coinId} />
                </Stack>
              </Paper>
            </Grid.Col>
          )}
        </Grid>
      )}
    </Container>
  );
}

export default Trade;
