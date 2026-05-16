export type Chain = "solana" | "base";

export interface SmartMoneyToken {
  symbol: string;
  chain: Chain;
  contractAddress: string;
  smart_money_wallets: number;
  net_flow_usd: number;
  unique_wallets: number;
}

interface NansenSmartMoneyFlowItem {
  symbol?: string;
  tokenSymbol?: string;
  chain?: string;
  blockchain?: string;
  address?: string;
  contractAddress?: string;
  tokenAddress?: string;
  smartMoneyCount?: number;
  smartMoneyWallets?: number;
  netFlowUsd?: number;
  netFlow?: number;
  uniqueWallets?: number;
  uniqueAddresses?: number;
}

const NANSEN_BASE_URL = "https://api.nansen.ai";
const CHAINS: Chain[] = ["solana", "base"];

// Maps Nansen chain identifiers to our canonical chain names
const CHAIN_ID_MAP: Record<string, Chain> = {
  solana: "solana",
  sol: "solana",
  base: "base",
  "8453": "base",
};

function normalizeChain(raw: string | undefined): Chain | null {
  if (!raw) return null;
  const key = raw.toLowerCase();
  return CHAIN_ID_MAP[key] ?? null;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }

    const res = await fetch(url, options);

    if (res.status === 429) {
      // Rate limited – always retry with backoff
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, delay));
      lastError = new Error("Nansen API rate limit exceeded");
      continue;
    }

    return res;
  }

  throw lastError ?? new Error("Nansen API request failed after retries");
}

async function fetchSmartMoneyFlowsForChain(
  apiKey: string,
  chain: Chain
): Promise<SmartMoneyToken[]> {
  const params = new URLSearchParams({
    chain,
    timeframe: "24h",
    limit: "100",
  });

  const url = `${NANSEN_BASE_URL}/v2/smart-money/token-flows?${params}`;

  const res = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Nansen API error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // Handle both array responses and wrapped { data: [...] } shapes
  const items: NansenSmartMoneyFlowItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.tokens)
    ? data.tokens
    : [];

  return items
    .map((item): SmartMoneyToken | null => {
      const rawChain = item.chain ?? item.blockchain ?? chain;
      const canonicalChain = normalizeChain(rawChain);
      if (!canonicalChain) return null;

      const symbol = item.symbol ?? item.tokenSymbol ?? "UNKNOWN";
      const contractAddress =
        item.address ?? item.contractAddress ?? item.tokenAddress ?? "";
      const smart_money_wallets =
        item.smartMoneyCount ?? item.smartMoneyWallets ?? 0;
      const net_flow_usd = item.netFlowUsd ?? item.netFlow ?? 0;
      const unique_wallets = item.uniqueWallets ?? item.uniqueAddresses ?? 0;

      return {
        symbol,
        chain: canonicalChain,
        contractAddress,
        smart_money_wallets,
        net_flow_usd,
        unique_wallets,
      };
    })
    .filter((t): t is SmartMoneyToken => t !== null);
}

export async function fetchSmartMoneyFlows(
  apiKey: string
): Promise<{ tokens: SmartMoneyToken[]; total_scanned: number }> {
  const results = await Promise.allSettled(
    CHAINS.map((chain) => fetchSmartMoneyFlowsForChain(apiKey, chain))
  );

  const tokens: SmartMoneyToken[] = [];
  let total_scanned = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      total_scanned += result.value.length;
      tokens.push(...result.value);
    }
    // Partial failures are tolerated – other chains still return data
  }

  if (tokens.length === 0 && results.every((r) => r.status === "rejected")) {
    const firstError = (results[0] as PromiseRejectedResult).reason;
    throw firstError instanceof Error
      ? firstError
      : new Error("All Nansen chain requests failed");
  }

  return { tokens, total_scanned };
}
