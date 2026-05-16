import type { SmartMoneyToken, Chain } from "./nansen";

export interface ScreenedToken {
  symbol: string;
  chain: Chain;
  smart_money_wallets: number;
  net_flow_usd: number;
  unique_wallets: number;
  score: number;
  nansen_url: string;
}

// Minimum thresholds
const MIN_SMART_MONEY_WALLETS = 5;
const MIN_NET_FLOW_USD = 5_000;
const MIN_UNIQUE_WALLETS = 20;

// Scoring weights (must sum to 1.0)
const WEIGHT_SMART_MONEY = 0.4;
const WEIGHT_NET_FLOW = 0.4;
const WEIGHT_UNIQUE_WALLETS = 0.2;

// Normalisation caps for score calculation
const CAP_SMART_MONEY = 100;
const CAP_NET_FLOW = 1_000_000;
const CAP_UNIQUE_WALLETS = 500;

function nansenUrl(token: SmartMoneyToken): string {
  const chainSlug = token.chain === "solana" ? "solana" : "base";
  if (token.contractAddress) {
    return `https://app.nansen.ai/token/${chainSlug}/${token.contractAddress}?tab=smart-money`;
  }
  return `https://app.nansen.ai/smart-money?chain=${chainSlug}`;
}

function computeScore(token: SmartMoneyToken): number {
  const smNorm = Math.min(token.smart_money_wallets / CAP_SMART_MONEY, 1);
  const flowNorm = Math.min(token.net_flow_usd / CAP_NET_FLOW, 1);
  const uwNorm = Math.min(token.unique_wallets / CAP_UNIQUE_WALLETS, 1);

  const raw =
    smNorm * WEIGHT_SMART_MONEY +
    flowNorm * WEIGHT_NET_FLOW +
    uwNorm * WEIGHT_UNIQUE_WALLETS;

  // Round to 4 decimal places
  return Math.round(raw * 10_000) / 10_000;
}

export function filterAndScore(tokens: SmartMoneyToken[]): ScreenedToken[] {
  return tokens
    .filter(
      (t) =>
        t.smart_money_wallets > MIN_SMART_MONEY_WALLETS &&
        t.net_flow_usd > MIN_NET_FLOW_USD &&
        t.unique_wallets > MIN_UNIQUE_WALLETS
    )
    .map((t) => ({
      symbol: t.symbol,
      chain: t.chain,
      smart_money_wallets: t.smart_money_wallets,
      net_flow_usd: t.net_flow_usd,
      unique_wallets: t.unique_wallets,
      score: computeScore(t),
      nansen_url: nansenUrl(t),
    }))
    .sort((a, b) => b.score - a.score);
}
