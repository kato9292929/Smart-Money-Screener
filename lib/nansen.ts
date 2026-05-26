export type Chain = "solana" | "base";

export interface SmartMoneyToken {
  symbol: string;
  chain: Chain;
  contractAddress: string;
  smart_money_wallets: number;
  net_flow_usd: number;
  unique_wallets: number;
}

// Nansen API may return fields under different names across versions.
// We handle all known variants here.
interface NansenFlowItem {
  // Symbol / name
  symbol?: string;
  tokenSymbol?: string;
  name?: string;
  // Chain
  chain?: string;
  blockchain?: string;
  network?: string;
  // Contract address
  address?: string;
  contractAddress?: string;
  tokenAddress?: string;
  token?: string;
  // Smart money wallet count
  smartMoneyCount?: number;
  smartMoneyWallets?: number;
  smartMoney?: number;
  wallets?: number;
  // Net flow (USD)
  netFlowUsd?: number;
  netFlow?: number;
  netFlowUSD?: number;
  flow?: number;
  // Unique wallets
  uniqueWallets?: number;
  uniqueAddresses?: number;
  unique?: number;
}

const NANSEN_BASE_URL = "https://api.nansen.ai";

// Maps Nansen chain identifiers to our canonical chain names
const CHAIN_ID_MAP: Record<string, Chain> = {
  solana: "solana",
  sol: "solana",
  base: "base",
  "8453": "base",
  "base-mainnet": "base",
};

function normalizeChain(raw: string | undefined): Chain | null {
  if (!raw) return null;
  return CHAIN_ID_MAP[raw.toLowerCase()] ?? null;
}

// Extracts items from various Nansen response shapes:
//   [ ... ]              → top-level array
//   { data: [ ... ] }
//   { tokens: [ ... ] }
//   { flows: [ ... ] }
//   { results: [ ... ] }
function extractItems(data: unknown): NansenFlowItem[] {
  if (Array.isArray(data)) return data as NansenFlowItem[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["data", "tokens", "flows", "results", "items"]) {
      if (Array.isArray(d[key])) return d[key] as NansenFlowItem[];
    }
  }
  return [];
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) =>
        setTimeout(r, 1000 * Math.pow(2, attempt - 1)),
      );
    }

    const res = await fetch(url, options);

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : 2000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, delay));
      lastError = new Error("Nansen API rate limit exceeded");
      continue;
    }

    return res;
  }

  throw lastError ?? new Error("Nansen API request failed after retries");
}

// Candidate endpoint configurations to try in order.
// The first one that returns non-404 is used.
const ENDPOINT_CANDIDATES = [
  // Most likely current endpoint
  (chain: string) =>
    `${NANSEN_BASE_URL}/v2/smart-money/flows?chain=${chain}&period=24h&limit=100`,
  // Alternative parameter names
  (chain: string) =>
    `${NANSEN_BASE_URL}/v2/smart-money/flows?chain=${chain}&timeframe=24h&limit=100`,
  // v1 fallback
  (chain: string) =>
    `${NANSEN_BASE_URL}/v1/smart-money/flows?chain=${chain}&period=24h&limit=100`,
  // Original path that was producing 404 – kept last as last resort
  (chain: string) =>
    `${NANSEN_BASE_URL}/v2/smart-money/token-flows?chain=${chain}&timeframe=24h&limit=100`,
] as const;

async function fetchSmartMoneyFlowsForChain(
  apiKey: string,
  chain: Chain,
): Promise<SmartMoneyToken[]> {
  const headers = {
    "X-API-KEY": apiKey,
    Accept: "application/json",
  };

  let lastBody = "";
  let lastStatus = 0;

  for (const buildUrl of ENDPOINT_CANDIDATES) {
    const url = buildUrl(chain);
    const res = await fetchWithRetry(url, { method: "GET", headers });

    if (res.status === 404) {
      lastBody = await res.text().catch(() => "");
      lastStatus = 404;
      // Try next candidate
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Nansen API error ${res.status} at ${url}: ${body}`,
      );
    }

    const data = await res.json();
    const items = extractItems(data);

    return items
      .map((item): SmartMoneyToken | null => {
        const rawChain = item.chain ?? item.blockchain ?? item.network ?? chain;
        const canonicalChain = normalizeChain(rawChain);
        if (!canonicalChain) return null;

        const symbol =
          item.symbol ?? item.tokenSymbol ?? item.name ?? "UNKNOWN";
        const contractAddress =
          item.address ??
          item.contractAddress ??
          item.tokenAddress ??
          item.token ??
          "";
        const smart_money_wallets =
          item.smartMoneyCount ??
          item.smartMoneyWallets ??
          item.smartMoney ??
          item.wallets ??
          0;
        const net_flow_usd =
          item.netFlowUsd ??
          item.netFlowUSD ??
          item.netFlow ??
          item.flow ??
          0;
        const unique_wallets =
          item.uniqueWallets ?? item.uniqueAddresses ?? item.unique ?? 0;

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

  // All candidates returned 404
  throw new Error(
    `Nansen API returned 404 on all known endpoint candidates for chain "${chain}". ` +
      `Last response: ${lastStatus} ${lastBody}. ` +
      `Please verify the correct endpoint in the Nansen API dashboard.`,
  );
}

export async function fetchSmartMoneyFlows(
  apiKey: string,
): Promise<{ tokens: SmartMoneyToken[]; total_scanned: number }> {
  const chains: Chain[] = ["solana", "base"];

  const results = await Promise.allSettled(
    chains.map((chain) => fetchSmartMoneyFlowsForChain(apiKey, chain)),
  );

  const tokens: SmartMoneyToken[] = [];
  let total_scanned = 0;
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      total_scanned += result.value.length;
      tokens.push(...result.value);
    } else {
      errors.push(`${chains[i]}: ${(result.reason as Error).message}`);
    }
  }

  if (tokens.length === 0 && results.every((r) => r.status === "rejected")) {
    throw new Error(
      `All Nansen chain requests failed:\n${errors.join("\n")}`,
    );
  }

  return { tokens, total_scanned };
}
