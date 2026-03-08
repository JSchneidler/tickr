import { useState } from "react";
import { Container, SimpleGrid } from "@mantine/core";

import { useGetCoinsQuery } from "../../store/api";
import CoinCard from "./CoinCard";
import CoinDetailModal from "./CoinDetailModal";

function Dashboard() {
  const { data: coins = [] } = useGetCoinsQuery();
  const [selectedCoinId, setSelectedCoinId] = useState<number | null>(null);

  return (
    <Container size="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {coins.map((coin) => (
          <CoinCard
            key={coin.id}
            coinId={coin.id}
            onExpand={() => {
              setSelectedCoinId(coin.id);
            }}
          />
        ))}
      </SimpleGrid>
      <CoinDetailModal
        coinId={selectedCoinId}
        opened={selectedCoinId !== null}
        onClose={() => {
          setSelectedCoinId(null);
        }}
      />
    </Container>
  );
}

export default Dashboard;
