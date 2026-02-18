import env from "../env";

interface CoinData {
  name: string;
  description: {
    en: string;
  };
  symbol: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
}

type PriceResponse = Record<
  string,
  {
    usd: number;
  }
>;

type CoinOHLCResponse = [number, number, number, number, number][];
export interface CoinOHLC {
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
}

export interface CoinHistoricalData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

const API_BASE_URL = "https://api.coingecko.com/api/v3";

// const EXCHANGE = "binance";

// TODO: Create client?
function baseRequest(url: string) {
  const request = new Request(API_BASE_URL + url);
  request.headers.append("x-cg-demo-api-key", env.COINGECKO_API_KEY);
  return request;
}

export async function getCoinData(coinId: string): Promise<CoinData> {
  const request = baseRequest(
    `/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
  );
  const response = await fetch(request);
  return (await response.json()) as CoinData;
}

export async function getPrice(coinId: string): Promise<string> {
  const request = baseRequest(`/simple/price?vs_currencies=usd&ids=${coinId}`);
  const response = await fetch(request);
  const price = (await response.json()) as PriceResponse;

  if (!price[coinId]) throw new Error("Failed to fetch coin price");

  return price[coinId].usd.toString();
}

export async function getOHLC(coinId: string): Promise<CoinOHLC> {
  const request = baseRequest(`/coins/${coinId}/ohlc?vs_currency=usd&days=1`);
  const response = await fetch(request);

  const data = (await response.json()) as CoinOHLCResponse;

  if (!data.length) throw new Error("Failed to fetch coin OHLC");

  const latest = data[data.length - 1];

  if (!latest) throw new Error("Failed to fetch coin OHLC (empty data)");

  return {
    open: latest[1],
    dayHigh: latest[2],
    dayLow: latest[3],
    previousClose: latest[4],
  };
}

export async function getHistoricalData(coinId: string, daysAgo: number) {
  function convertNums(data: [number, number]): [number, string] {
    return [data[0], data[1].toString()];
  }

  const request = baseRequest(
    `/coins/${coinId}/market_chart?vs_currency=usd&days=${daysAgo.toString()}`,
  );
  const response = await fetch(request);
  const data = (await response.json()) as CoinHistoricalData;

  return {
    prices: data.prices.map(convertNums),
    marketCaps: data.market_caps.map(convertNums),
    totalVolumes: data.total_volumes.map(convertNums),
  };
}
