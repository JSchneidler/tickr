interface SupportedCoin {
  displayName: string;
  externalId: string;
}

export const SUPPORTED_COINS: SupportedCoin[] = [
  { displayName: "Bitcoin", externalId: "bitcoin" },
  { displayName: "Ethereum", externalId: "ethereum" },
  { displayName: "Ripple", externalId: "ripple" },
  { displayName: "Dogecoin", externalId: "dogecoin" },
  { displayName: "Binancecoin", externalId: "binancecoin" },
  { displayName: "Solana", externalId: "solana" },
  { displayName: "Tron", externalId: "tron" },
];
