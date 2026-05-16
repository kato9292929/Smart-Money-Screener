export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1>Smart Money Screener API</h1>
      <p>
        Real-time smart money net-flow data for <strong>Solana</strong> and{" "}
        <strong>Base</strong>, powered by{" "}
        <a href="https://nansen.ai" target="_blank" rel="noopener noreferrer">
          Nansen
        </a>
        .
      </p>

      <h2>Endpoint</h2>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "1rem",
          borderRadius: "4px",
          overflowX: "auto",
        }}
      >
        GET /api/screener/smart-money
      </pre>

      <h2>Payment</h2>
      <p>
        Requires <strong>$0.05 USDC on Base</strong> per request via the{" "}
        <a
          href="https://x402.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          x402 protocol
        </a>
        .
      </p>

      <h2>Filters applied</h2>
      <ul>
        <li>Smart Money Wallets &gt; 5</li>
        <li>Net Flow &gt; $5,000 (24 h)</li>
        <li>Unique Wallets &gt; 20</li>
      </ul>

      <h2>Discovery</h2>
      <ul>
        <li>
          <a href="/api/x402">/api/x402</a> – x402 discovery document
        </li>
        <li>
          <a href="/.well-known/x402.json">/.well-known/x402.json</a> – static
          discovery document
        </li>
      </ul>
    </main>
  );
}
