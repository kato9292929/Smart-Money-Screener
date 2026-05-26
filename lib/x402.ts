import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";

/**
 * Builds an HTTPFacilitatorClient with automatic facilitator selection:
 *   1. CDP_API_KEY_ID + CDP_API_KEY_SECRET  → Coinbase CDP facilitator
 *   2. FACILITATOR_URL                       → custom facilitator
 *   3. (none)                                → x402 default facilitator
 */
function buildFacilitatorClient(): HTTPFacilitatorClient {
  const cdpKeyId     = process.env.CDP_API_KEY_ID;
  const cdpKeySecret = process.env.CDP_API_KEY_SECRET;

  if (cdpKeyId && cdpKeySecret) {
    const config = createFacilitatorConfig(cdpKeyId, cdpKeySecret);
    return new HTTPFacilitatorClient(config);
  }

  const facilitatorUrl = process.env.FACILITATOR_URL;
  if (facilitatorUrl) {
    return new HTTPFacilitatorClient({ url: facilitatorUrl });
  }

  // Default: x402.org public facilitator (fine for development)
  return new HTTPFacilitatorClient();
}

const facilitatorClient = buildFacilitatorClient();

/**
 * Shared x402 resource server for this application.
 * Registers:
 *   - EVM exact-payment scheme with eip155:* wildcard (Base mainnet, etc.)
 *   - SVM exact-payment scheme for Solana mainnet
 *
 * NOTE: syncFacilitatorOnStart is intentionally left at its default (true).
 * Setting it to false causes the supported kinds to remain empty on Vercel
 * runtimes, which results in 500 errors instead of 402.
 */
export const x402Server = registerExactSvmScheme(
  registerExactEvmScheme(
    new x402ResourceServer(facilitatorClient),
  ),
);
