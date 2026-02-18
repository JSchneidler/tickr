import { ReactElement, useState } from "react";
import { Title, Container, Text, Divider, Stack, Group } from "@mantine/core";

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
    <div>
      <CoinSelector
        onCoinSelect={(id) => {
          setCoinId(+id);
        }}
      />
      {coin && (
        <Container size="xl" pt={50}>
          <Title order={3} fw="normal">
            {coin.displayName} ({coin.name})
          </Title>
          <Title>
            <Dollars value={price} size="xl" fw="bolder" />
            <Gain change={change} changePercent={changePercent} size="md" />
          </Title>
          <Divider m={10} />
          <Group justify="space-between" align="flex-start" grow>
            <Stack>
              {coinId && <Chart coinId={coinId} />}
              <Info
                label="Range"
                element={
                  <span>
                    {<Dollars value={coin.dayLow} />} -{" "}
                    {<Dollars value={coin.dayHigh} />}
                  </span>
                }
              />
            </Stack>
            {user && (
              <Stack>
                <TradeForm coinId={coinId} />
                <Divider m={10} />
                <Holding coinId={coinId} />
                <Divider m={10} />
                <Orders coinId={coinId} />
              </Stack>
            )}
          </Group>
          <Divider m={10} />
          <Text>{coin.description}</Text>
        </Container>
      )}
    </div>
  );
}

export default Trade;
