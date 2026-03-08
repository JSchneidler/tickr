import { useEffect, useMemo, useRef } from "react";
import {
  Paper,
  Group,
  Stack,
  Text,
  Image,
  Button,
  Divider,
} from "@mantine/core";
import {
  createChart,
  LineSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import Decimal from "decimal.js";

import {
  useGetCoinQuery,
  useGetMyHoldingsQuery,
  useGetMyOrdersQuery,
  useGetCoinHistoricalDataQuery,
  useCreateOrderMutation,
  useMeQuery,
} from "../../store/api";
import { useLivePrice } from "../../hooks/useLivePrice";
import { selectHoldingForCoin } from "../../store/selectors";
import { OrderDirection, OrderType } from "@tickr/shared";
import Dollars from "../Dollars";
import Gain from "../Gain";

const PRESETS = [100, 500, 1000, 5000] as const;

function presetLabel(amount: number) {
  return amount >= 1000 ? `$${String(amount / 1000)}k` : `$${String(amount)}`;
}

// ── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  coinId: number;
}

function Sparkline({ coinId }: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { data: historicalData } = useGetCoinHistoricalDataQuery({
    coinId,
    daysAgo: 7,
  });

  const color = useMemo(() => {
    if (!historicalData?.prices.length) return "#228be6";
    const first = historicalData.prices[0];
    const last = historicalData.prices[historicalData.prices.length - 1];
    if (!first || !last) return "#228be6";
    return new Decimal(last[1]).gte(new Decimal(first[1]))
      ? "#40c057"
      : "#fa5252";
  }, [historicalData]);

  // Create chart once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        attributionLogo: false,
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      timeScale: { visible: false },
      rightPriceScale: { visible: false },
      handleScroll: false,
      handleScale: false,
      width: container.clientWidth,
      height: 70,
    });

    const series = chart.addSeries(LineSeries, {
      color: "#228be6",
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) chart.applyOptions({ width: entry.contentRect.width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Set data when it arrives
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || !historicalData) return;

    const points = historicalData.prices.map(([ts, p]) => ({
      time: Math.floor(ts / 1000) as UTCTimestamp,
      value: new Decimal(p).toNumber(),
    }));
    series.setData(points);
    chart.timeScale().fitContent();
  }, [historicalData]);

  // Update line color once computed
  useEffect(() => {
    seriesRef.current?.applyOptions({ color });
  }, [color]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}

// ── CoinCard ─────────────────────────────────────────────────────────────────

interface CoinCardProps {
  coinId: number;
  onExpand: () => void;
}

function CoinCard({ coinId, onExpand }: CoinCardProps) {
  const { data: coin } = useGetCoinQuery(coinId);
  const { price, change, changePercent } = useLivePrice(coinId);
  const { data: user } = useMeQuery();

  const { holding } = useGetMyHoldingsQuery(undefined, {
    selectFromResult: (result) => ({
      holding: selectHoldingForCoin(result, coinId),
    }),
  });

  const { data: allOrders = [] } = useGetMyOrdersQuery();
  const [createOrder] = useCreateOrderMutation();

  if (!coin) return null;

  const activeOrderCount = allOrders.filter(
    (o) => o.coinId === coinId && !o.filled,
  ).length;

  const marketValue =
    holding && price ? new Decimal(holding.shares).mul(price) : null;
  const pnl = holding && marketValue ? marketValue.sub(holding.cost) : null;

  function buyPreset(amount: number) {
    void createOrder({
      coinId,
      cost: amount.toString(),
      type: OrderType.MARKET,
      direction: OrderDirection.BUY,
    });
  }

  function sellPreset(amount: number) {
    void createOrder({
      coinId,
      cost: amount.toString(),
      type: OrderType.MARKET,
      direction: OrderDirection.SELL,
    });
  }

  function sellAll() {
    if (!holding) return;
    void createOrder({
      coinId,
      shares: holding.shares,
      type: OrderType.MARKET,
      direction: OrderDirection.SELL,
    });
  }

  function isBuyDisabled(amount: number) {
    if (!user) return true;
    return new Decimal(amount).gt(user.balance);
  }

  function isSellDisabled(amount: number) {
    if (!holding || !marketValue) return true;
    return new Decimal(amount).gt(marketValue);
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        {/* Header: coin info + live price */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Image src={coin.imageUrl} h={32} w={32} fit="contain" />
            <Stack gap={0}>
              <Text fw={600} size="sm">
                {coin.displayName}
              </Text>
              <Text size="xs" c="dimmed">
                {coin.name}
              </Text>
            </Stack>
          </Group>
          <Stack gap={0} align="flex-end">
            <Dollars value={price} fw="bold" size="sm" />
            <Gain change={change} changePercent={changePercent} size="xs" />
          </Stack>
        </Group>

        {/* 7d sparkline */}
        <Sparkline coinId={coinId} />

        {/* Holdings */}
        {holding && (
          <>
            <Divider />
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Holdings
                </Text>
                <Text size="sm">{holding.shares} shares</Text>
              </Stack>
              <Stack gap={0} align="flex-end">
                {marketValue && (
                  <Dollars value={marketValue.toString()} size="sm" />
                )}
                {pnl && (
                  <Text size="xs" c={pnl.gte(0) ? "green" : "red"}>
                    {pnl.gte(0) ? "+" : ""}
                    {pnl.toFixed(2)}
                  </Text>
                )}
              </Stack>
            </Group>
            {activeOrderCount > 0 && (
              <Text size="xs" c="dimmed">
                {activeOrderCount} active order
                {activeOrderCount !== 1 ? "s" : ""}
              </Text>
            )}
          </>
        )}

        {/* Quick trade (logged-in only) */}
        {user && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="xs" c="dimmed" fw={500}>
                Quick Buy
              </Text>
              <Button.Group>
                {PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    size="xs"
                    color="green"
                    variant="light"
                    disabled={isBuyDisabled(amount)}
                    onClick={() => {
                      buyPreset(amount);
                    }}
                    fullWidth
                  >
                    {presetLabel(amount)}
                  </Button>
                ))}
              </Button.Group>
              <Text size="xs" c="dimmed" fw={500}>
                Quick Sell
              </Text>
              <Button.Group>
                {PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    size="xs"
                    color="red"
                    variant="light"
                    disabled={isSellDisabled(amount)}
                    onClick={() => {
                      sellPreset(amount);
                    }}
                    fullWidth
                  >
                    {presetLabel(amount)}
                  </Button>
                ))}
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  disabled={!holding}
                  onClick={sellAll}
                  fullWidth
                >
                  All
                </Button>
              </Button.Group>
            </Stack>
          </>
        )}

        <Divider />
        <Button variant="subtle" size="xs" onClick={onExpand}>
          Expand ↗
        </Button>
      </Stack>
    </Paper>
  );
}

export default CoinCard;
