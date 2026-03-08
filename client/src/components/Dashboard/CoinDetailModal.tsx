import { Modal, Grid, Stack, Paper, Text, Group, Image } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";

import { useGetCoinQuery, useMeQuery } from "../../store/api";
import { useLivePrice } from "../../hooks/useLivePrice";
import Chart from "../Trade/Chart";
import TradeForm from "../Trade/TradeForm";
import Holding from "../Trade/Holding";
import Orders from "../Trade/Orders";
import Dollars from "../Dollars";
import Gain from "../Gain";

interface CoinDetailModalProps {
  coinId: number | null;
  opened: boolean;
  onClose: () => void;
}

function CoinDetailModal({ coinId, opened, onClose }: CoinDetailModalProps) {
  const { data: coin } = useGetCoinQuery(coinId ?? skipToken);
  const { price, change, changePercent } = useLivePrice(coinId ?? undefined);
  const { data: user } = useMeQuery();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        coin ? (
          <Group gap="xs">
            <Image src={coin.imageUrl} h={24} w={24} fit="contain" />
            <Text fw={600}>
              {coin.displayName} ({coin.name})
            </Text>
          </Group>
        ) : null
      }
    >
      {coin && coinId != null && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack>
              <Paper withBorder p="md">
                <Group align="baseline" gap="xs" mb="sm">
                  <Dollars value={price} size="xl" fw="bolder" />
                  <Gain
                    change={change}
                    changePercent={changePercent}
                    size="md"
                  />
                </Group>
                <Chart coinId={coinId} />
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
    </Modal>
  );
}

export default CoinDetailModal;
