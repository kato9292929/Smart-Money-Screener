"use client";

import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────────────────────── */
type Lang = "jp" | "en";
type Tab  = "traders" | "agents";

interface Token {
  rank: number;
  symbol: string;
  chain: "solana" | "base";
  smWallets: number;
  netFlow: number;
  score: number;
}

const INIT_TOKENS: Token[] = [
  { rank: 1, symbol: "$BURNIE", chain: "solana", smWallets: 66, netFlow: 20400, score: 0.847 },
  { rank: 2, symbol: "$GOBLIN", chain: "solana", smWallets: 68, netFlow: 5900,  score: 0.721 },
  { rank: 3, symbol: "$LABS",   chain: "base",   smWallets: 42, netFlow: 8200,  score: 0.634 },
];

const API_URL = "https://smartmoneyscreener.vercel.app/api/screener/smart-money";

const CURL_SNIPPET = `# まず 402 レスポンスを確認 / Inspect the 402 first
curl -i ${API_URL}`;

const AGENT_SNIPPET = `# x402 対応クライアントで自動決済 / Auto-settle with x402
npx x402-fetch ${API_URL}`;

/* ─────────────────────────────────────────────────────────────
   Tiny helpers
───────────────────────────────────────────────────────────── */
const clamp  = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const randI  = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randF  = (lo: number, hi: number) => Math.random() * (hi - lo) + lo;
const fmt$   = (n: number) => `+$${Math.round(n).toLocaleString("en-US")}`;

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */
function LiveDot() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="live-dot inline-block w-2 h-2 rounded-full bg-[#00ff87]" />
      <span className="font-mono text-[10px] tracking-[0.2em] text-[#00ff87] uppercase">Live</span>
    </span>
  );
}

function ChainPill({ chain }: { chain: "solana" | "base" }) {
  return chain === "solana" ? (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/40">
      SOL
    </span>
  ) : (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/40">
      BASE
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score > 0.75 ? "#00ff87" : score > 0.6 ? "#d4af37" : "#888";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
        <div
          className="bar-fill h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono text-[#888]">{score.toFixed(3)}</span>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="relative bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg overflow-hidden">
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-[10px] font-mono text-[#888] hover:text-[#00ff87] transition-colors px-2 py-1 border border-[#1f1f1f] rounded"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
      <pre className="p-5 text-sm font-mono text-[#00ff87] whitespace-pre-wrap overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function Home() {
  const [lang, setLang]   = useState<Lang>("jp");
  const [tokens, setTokens] = useState<Token[]>(INIT_TOKENS);
  const [secsAgo, setSecsAgo] = useState(0);
  const [flashed, setFlashed] = useState(false);
  const [tab, setTab]     = useState<Tab>("traders");

  /* Tick every second */
  useEffect(() => {
    const id = setInterval(() => setSecsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Wiggle mock data every 5 s */
  useEffect(() => {
    const id = setInterval(() => {
      setTokens((prev) =>
        prev.map((t) => ({
          ...t,
          smWallets: clamp(t.smWallets + randI(-2, 3), 6, 120),
          netFlow:   clamp(t.netFlow   + randI(-400, 700), 5001, 60000),
          score:     clamp(t.score     + randF(-0.012, 0.012), 0.50, 0.99),
        }))
      );
      setFlashed(true);
      setSecsAgo(0);
      setTimeout(() => setFlashed(false), 700);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const jp = lang === "jp";
  const t  = (j: string, e: string) => (jp ? j : e);

  /* ── RENDER ── */
  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1f1f1f] px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="text-[#00ff87] font-bold text-xl leading-none">▲</span>
          <span className="font-mono text-sm font-semibold tracking-tight">Smart Money Screener</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/kato9292929/Smart-Money-Screener"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#888] hover:text-white transition-colors text-xs font-mono"
          >
            GitHub
          </a>
          <button
            onClick={() => setLang((l) => (l === "jp" ? "en" : "jp"))}
            className="text-[11px] font-mono border border-[#1f1f1f] text-[#888] hover:text-white hover:border-[#00ff87] px-3 py-1 rounded transition-colors"
          >
            {jp ? "EN" : "JP"}
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="px-5 pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <LiveDot />
          <span className="text-[#888] text-xs font-mono">Powered by Nansen</span>
        </div>

        {jp ? (
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-7">
            スマートマネーが
            <br />
            <span className="text-[#00ff87]">今、動いている</span>
          </h1>
        ) : (
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-7">
            Smart money is
            <br />
            <span className="text-[#00ff87]">moving right now.</span>
          </h1>
        )}

        <p className="text-[#888] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Real-time smart money screening for Solana &amp; Base.
          <br />
          <span className="text-white font-semibold">
            $0.05 per query. No signup. No subscription.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={API_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#00ff87] text-black font-bold font-mono px-8 py-4 rounded-lg text-base hover:opacity-90 active:scale-95 transition-all"
          >
            {t("今すぐ API を叩く  $0.05", "Hit the API  $0.05")}
          </a>
          <a
            href="https://x402scan.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#00ff87] text-[#00ff87] font-bold font-mono px-8 py-4 rounded-lg text-base hover:bg-[#00ff87]/10 active:scale-95 transition-all"
          >
            {t("x402scan で確認", "View on x402scan")}
          </a>
        </div>
      </section>

      {/* ── Live Scan Table ─────────────────────────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <LiveDot />
            <span className="font-mono font-bold text-sm tracking-wider">LIVE SCAN</span>
            <span className="text-[10px] font-mono border border-[#1f1f1f] text-[#888] px-2 py-0.5 rounded">
              DEMO DATA
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#888]">
            Last updated: {secsAgo}s ago
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1f1f1f]">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {["RANK", "TOKEN", "CHAIN", "SM WALLETS", "NET FLOW (24h)", "SCORE"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-mono tracking-widest text-[#555] uppercase ${i >= 3 ? "text-right" : "text-left"} ${i === 5 ? "text-left" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((tok, i) => (
                <tr
                  key={tok.rank}
                  className={`border-b border-[#1f1f1f] last:border-0 transition-colors duration-300 ${
                    flashed ? "row-flash" : "bg-[#111111] hover:bg-[#161616]"
                  }`}
                >
                  <td className="px-4 py-4 font-mono text-[#555] text-sm">#{tok.rank}</td>
                  <td className="px-4 py-4 font-mono font-bold text-white">{tok.symbol}</td>
                  <td className="px-4 py-4">
                    <ChainPill chain={tok.chain} />
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-semibold text-sm ${
                      tok.smWallets >= 60 ? "text-[#00ff87]" : "text-white"
                    }`}
                  >
                    {tok.smWallets}
                    <span className="text-[#555] text-[10px] ml-1">wallets</span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-[#00ff87] text-sm">
                    {fmt$(tok.netFlow)}
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar score={tok.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-[#555] mt-2 text-right font-mono">
          Filter: SM Wallets &gt; 5 · Net Flow &gt; $5,000 · Unique Wallets &gt; 20 · Nansen data
        </p>
      </section>

      {/* ── Stats ───────────────────────────────────────── */}
      <section className="border-y border-[#1f1f1f] bg-[#111111] px-5 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            {
              value: "1,353",
              jp:    "デイリースキャン\nトークン数",
              en:    "Tokens scanned\ndaily",
            },
            {
              value: "4",
              jp:    "過去 7 日で 100x 達成\n（Nansen データ）",
              en:    "Hit 100x in 7 days\n(Nansen data)",
            },
            {
              value: "$0.05",
              jp:    "1 クエリあたり\n必要な時だけ払う",
              en:    "Per query\nPay only when you need it",
            },
          ].map(({ value, jp: jpLabel, en: enLabel }, idx) => (
            <div key={value} className="fade-up" style={{ animationDelay: `${idx * 0.12}s` }}>
              <div className="text-5xl md:text-6xl font-bold text-[#00ff87] font-mono mb-3">
                {value}
              </div>
              <div className="text-[#888] text-sm whitespace-pre-line leading-relaxed">
                {t(jpLabel, enLabel)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filter Cards ────────────────────────────────── */}
      <section className="px-5 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {t(
              "エージェントが通過できない\nノイズを除去する",
              "Remove the noise agents can't filter"
            )}
          </h2>
          <p className="text-[#888] text-base">The signal, not the noise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon:  "🔍",
              rule:  "SM Wallets > 5",
              jp:    "プロのトレーダーが 5 人以上保有。機関・ホエールが注目しているシグナル。",
              en:    "5+ pro traders holding. Institutional signal worth tracking.",
            },
            {
              icon:  "💰",
              rule:  "Net Flow > $5,000",
              jp:    "過去 24 時間で $5,000 以上の純流入。売り圧よりも買い圧が優勢。",
              en:    "$5k+ net inflow in 24h. More buying pressure than selling.",
            },
            {
              icon:  "👥",
              rule:  "Unique Wallets > 20",
              jp:    "自作自演ではない本物の需要。ウォッシュトレードを弾くフィルター。",
              en:    "Real organic demand. Filters out wash trading effectively.",
            },
          ].map(({ icon, rule, jp: jpText, en: enText }) => (
            <div
              key={rule}
              className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 hover:border-[#00ff87]/40 transition-colors group"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <div className="font-mono text-xs text-[#00ff87] font-semibold mb-3 group-hover:text-[#00ff87]">
                {rule}
              </div>
              <p className="text-[#888] text-sm leading-relaxed">
                {t(jpText, enText)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Access ──────────────────────────────────── */}
      <section className="bg-[#111111] border-y border-[#1f1f1f] px-5 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">
              {t("API で直接叩く", "Hit the API directly")}
            </h2>
            <span className="text-xs font-mono border border-[#00ff87]/40 text-[#00ff87] px-3 py-1.5 rounded-full">
              $0.05 USDC on Base
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1f1f1f] mb-6">
            {(["traders", "agents"] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-5 py-2.5 text-xs font-mono font-semibold -mb-px border-b-2 transition-colors ${
                  tab === tabKey
                    ? "text-[#00ff87] border-[#00ff87]"
                    : "text-[#555] border-transparent hover:text-[#888]"
                }`}
              >
                {tabKey === "traders"
                  ? t("📈 トレーダー向け (curl)", "📈 For Traders (curl)")
                  : t("🤖 AI エージェント向け", "🤖 For AI Agents")}
              </button>
            ))}
          </div>

          <CodeBlock code={tab === "traders" ? CURL_SNIPPET : AGENT_SNIPPET} />

          <p className="text-[11px] text-[#555] mt-3 font-mono">
            {t(
              "* curl では 402 が返ります。x402 対応クライアントが自動決済します。",
              "* Plain curl returns 402. x402-compatible clients auto-settle."
            )}
          </p>
        </div>
      </section>

      {/* ── x402 Comparison ─────────────────────────────── */}
      <section className="px-5 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {t("月額契約はいらない", "No subscription needed")}
          </h2>
          <p className="text-[#888] text-base">
            No subscription. No API key. Just pay per query.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: problems */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-7">
            <div className="font-mono text-sm font-bold text-[#ff4444] mb-5">
              {t("❌ 月額制の問題", "❌ Subscription problems")}
            </div>
            {[
              { jp: "使わない月も $299/月", en: "$299/mo even when unused" },
              { jp: "API キー管理が必要",   en: "API key management overhead" },
              { jp: "エージェントに渡せない", en: "Can't delegate to AI agents" },
            ].map(({ jp: jpT, en: enT }) => (
              <div
                key={jpT}
                className="flex items-start gap-3 py-3 border-b border-[#1f1f1f] last:border-0 text-sm text-[#888]"
              >
                <span className="text-[#ff4444] mt-0.5 shrink-0">✕</span>
                {t(jpT, enT)}
              </div>
            ))}
          </div>

          {/* Right: x402 */}
          <div className="bg-[#111111] border border-[#00ff87]/30 rounded-xl p-7">
            <div className="font-mono text-sm font-bold text-[#00ff87] mb-5">
              {t("✅ x402 の仕組み", "✅ How x402 works")}
            </div>
            {[
              { jp: "使った分だけ $0.05",      en: "Only $0.05 per query used" },
              { jp: "API キー不要",             en: "No API key required" },
              { jp: "AI エージェントが自律決済", en: "AI agents pay autonomously" },
            ].map(({ jp: jpT, en: enT }) => (
              <div
                key={jpT}
                className="flex items-start gap-3 py-3 border-b border-[#1f1f1f] last:border-0 text-sm text-[#888]"
              >
                <span className="text-[#00ff87] mt-0.5 shrink-0">✓</span>
                {t(jpT, enT)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-[#1f1f1f] px-5 py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-[11px] font-mono border border-[#00ff87]/40 text-[#00ff87] px-3 py-1.5 rounded-full">
            ✓ x402scan Registered
          </span>
          <span className="text-[11px] font-mono border border-[#1f1f1f] text-[#555] px-3 py-1.5 rounded-full">
            Base Mainnet
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-[#555] mb-5 font-mono">
          {[
            { label: "GitHub",       href: "https://github.com/kato9292929/Smart-Money-Screener" },
            { label: "Discovery",    href: "/api/x402" },
            { label: "Nansen",       href: "https://nansen.ai" },
            { label: "x402 Protocol", href: "https://x402.org" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="hover:text-[#00ff87] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <p className="text-[11px] text-[#333] font-mono">
          Built with Nansen API + x402 Protocol
        </p>
      </footer>
    </main>
  );
}
