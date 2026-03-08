import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import { SegmentedControl } from "@mantine/core";
import Decimal from "decimal.js";

import {
  useGetCoinHistoricalDataQuery,
  useGetCoinOHLCDataQuery,
} from "../../store/api";
import { useLivePrice } from "../../hooks/useLivePrice";

interface ChartProps {
  coinId: number;
}

enum Timespan {
  LIVE = "LIVE",
  DAYS_1 = "1",
  DAYS_7 = "7",
  DAYS_30 = "30",
  DAYS_90 = "90",
  DAYS_180 = "180",
  DAYS_365 = "365",
}

enum ChartType {
  CANDLESTICK = "candlestick",
  LINE = "line",
  VOLUME = "volume",
}

const TIMESPAN_OPTIONS = [
  { label: "Live", value: Timespan.LIVE },
  { label: "1d", value: Timespan.DAYS_1 },
  { label: "7d", value: Timespan.DAYS_7 },
  { label: "1m", value: Timespan.DAYS_30 },
  { label: "3m", value: Timespan.DAYS_90 },
  { label: "6m", value: Timespan.DAYS_180 },
  { label: "1y", value: Timespan.DAYS_365 },
];

const CHART_TYPE_OPTIONS = [
  { label: "Candles", value: ChartType.CANDLESTICK },
  { label: "Line", value: ChartType.LINE },
  { label: "Volume", value: ChartType.VOLUME },
];

function toSec(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function Chart({ coinId }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const liveDataRef = useRef<{ time: UTCTimestamp; value: number }[]>([]);

  const [timespan, setTimespan] = useState(Timespan.DAYS_1);
  const [chartType, setChartType] = useState(ChartType.LINE);

  const isLive = timespan === Timespan.LIVE;

  const { price } = useLivePrice(coinId);

  const { data: historicalData } = useGetCoinHistoricalDataQuery(
    { coinId, daysAgo: +timespan },
    { skip: !coinId || isLive || chartType === ChartType.CANDLESTICK },
  );

  const { data: ohlcData } = useGetCoinOHLCDataQuery(
    { coinId, daysAgo: +timespan },
    { skip: !coinId || isLive || chartType !== ChartType.CANDLESTICK },
  );

  // Create chart once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        attributionLogo: false,
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#909296",
      },
      grid: {
        vertLines: { color: "#2C2E33" },
        horzLines: { color: "#2C2E33" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true, secondsVisible: false },
      width: container.clientWidth,
      height: 300,
    });

    chartRef.current = chart;

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

  // Rebuild series when data or chart type changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (isLive) {
      const series = chart.addSeries(LineSeries, {
        color: "#228be6",
        lineWidth: 2,
      });
      seriesRef.current = series;
      return;
    }

    if (chartType === ChartType.CANDLESTICK && ohlcData) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#40c057",
        downColor: "#fa5252",
        borderVisible: false,
        wickUpColor: "#40c057",
        wickDownColor: "#fa5252",
      });
      // Deduplicate by timestamp and sort ascending
      const seen = new Map<
        number,
        {
          time: UTCTimestamp;
          open: number;
          high: number;
          low: number;
          close: number;
        }
      >();
      for (const [ts, open, high, low, close] of ohlcData.ohlc) {
        seen.set(ts, { time: toSec(ts), open, high, low, close });
      }
      const candles = Array.from(seen.values()).sort((a, b) => a.time - b.time);
      series.setData(candles);
      seriesRef.current = series;
      chart.timeScale().fitContent();
      return;
    }

    if (chartType === ChartType.LINE && historicalData) {
      const series = chart.addSeries(LineSeries, {
        color: "#228be6",
        lineWidth: 2,
      });
      const points = historicalData.prices.map(([ts, p]) => ({
        time: toSec(ts),
        value: new Decimal(p).toNumber(),
      }));
      series.setData(points);
      seriesRef.current = series;
      chart.timeScale().fitContent();
      return;
    }

    if (chartType === ChartType.VOLUME && historicalData) {
      const series = chart.addSeries(HistogramSeries, {
        color: "#228be6",
        priceFormat: { type: "volume" },
      });
      const points = historicalData.totalVolumes.map(([ts, v]) => ({
        time: toSec(ts),
        value: new Decimal(v).toNumber(),
      }));
      series.setData(points);
      seriesRef.current = series;
      chart.timeScale().fitContent();
      return;
    }
  }, [isLive, chartType, ohlcData, historicalData]);

  // Clear live data when coin changes
  useEffect(() => {
    liveDataRef.current = [];
    if (isLive && seriesRef.current) {
      (seriesRef.current as ISeriesApi<"Line">).setData([]);
    }
  }, [coinId, isLive]);

  // Accumulate live prices
  useEffect(() => {
    if (!isLive || !price || !seriesRef.current) return;
    const series = seriesRef.current as ISeriesApi<"Line">;
    const point = {
      time: toSec(Date.now()),
      value: new Decimal(price).toNumber(),
    };
    const last = liveDataRef.current[liveDataRef.current.length - 1];
    if (!last || (point.time as number) >= (last.time as number)) {
      liveDataRef.current = [...liveDataRef.current, point];
      series.setData(liveDataRef.current);
    }
  }, [price, isLive]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "8px",
        }}
      >
        <SegmentedControl
          data={CHART_TYPE_OPTIONS}
          value={chartType}
          onChange={(v) => {
            setChartType(v as ChartType);
          }}
          size="xs"
          disabled={isLive}
        />
      </div>
      <div ref={containerRef} style={{ width: "100%" }} />
      <SegmentedControl
        data={TIMESPAN_OPTIONS}
        value={timespan}
        onChange={(v) => {
          setTimespan(v as Timespan);
          if ((v as Timespan) === Timespan.LIVE) liveDataRef.current = [];
        }}
        fullWidth
        size="xs"
        mt="xs"
      />
    </div>
  );
}

export default Chart;
