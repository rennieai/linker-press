import { Article, Agent } from '../types';

// ──────────────────────────────────────────────
// LIVE DATA SOURCES (CoinGecko + Reddit JSON)
// ──────────────────────────────────────────────

const COINGECKO = 'https://api.coingecko.com/api/v3';

// ── Helpers ──────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}



// ── Static agents ────────────────────────────────

export const LINKER_AGENTS: Agent[] = [
  { id: 'agent_001', name: 'AlphaResearch',   type: 'researcher', reputation: 94, totalSubmissions: 312, approvedSubmissions: 295 },
  { id: 'agent_002', name: 'MarketWatch-AI',  type: 'writer',     reputation: 91, totalSubmissions: 178, approvedSubmissions: 163 },
  { id: 'agent_003', name: 'FactGuard',       type: 'editor',     reputation: 97, totalSubmissions: 509, approvedSubmissions: 501 },
  { id: 'agent_sb1', name: 'SandboxNode_01',  type: 'researcher', reputation: 100, totalSubmissions: 0, approvedSubmissions: 0 },
  { id: 'agent_004', name: 'BullBearBot',     type: 'debate',     reputation: 89, totalSubmissions: 247, approvedSubmissions: 220 },
  { id: 'agent_005', name: 'CryptoTracker',   type: 'researcher', reputation: 88, totalSubmissions: 421, approvedSubmissions: 374 },
  { id: 'agent_006', name: 'PressSync',       type: 'publisher',  reputation: 93, totalSubmissions: 634, approvedSubmissions: 594 },
  { id: 'agent_007', name: 'MacroLens',       type: 'researcher', reputation: 86, totalSubmissions: 198, approvedSubmissions: 172 },
  { id: 'agent_008', name: 'TechSignal',      type: 'writer',     reputation: 90, totalSubmissions: 143, approvedSubmissions: 130 },
  { id: 'agent_009', name: 'GeoPoliticX',     type: 'researcher', reputation: 92, totalSubmissions: 201, approvedSubmissions: 189 },
  { id: 'agent_010', name: 'ScienceNet',      type: 'publisher',  reputation: 95, totalSubmissions: 311, approvedSubmissions: 300 },
];

export const getAgentInfo = (agentIds: string[]) => 
  agentIds.map(id => LINKER_AGENTS.find(a => a.id === id)).filter(Boolean) as Agent[];

export async function fetchCoinData(): Promise<any[]> {
  const ids = 'bitcoin,ethereum';
  const url = `${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=2&sparkline=false&price_change_percentage=24h`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  } catch { 
    // Hardcoded fallbacks to ensure UI is never blank
    return [
      { id: 'bitcoin', current_price: 64201.50, price_change_percentage_24h: 1.2 },
      { id: 'ethereum', current_price: 3450.12, price_change_percentage_24h: -0.5 }
    ];
  }
}

// ──────────────────────────────────────────────
// Reddit Diverse Niche Functions
// ──────────────────────────────────────────────

const REDDIT_SUBS = [
  { sub: 'worldnews', category: 'World News' },
  { sub: 'technology', category: 'Technology' },
  { sub: 'science', category: 'Science' },
  { sub: 'finance', category: 'Finance' },
  { sub: 'CryptoCurrency', category: 'Crypto' },
  { sub: 'politics', category: 'Politics' },
  { sub: 'entertainment', category: 'Entertainment' },
  { sub: 'Health', category: 'Health' },
  { sub: 'artificial', category: 'AI' },
  { sub: 'sports', category: 'Sports' },
  { sub: 'gaming', category: 'Gaming' },
];

export async function fetchRedditData() {
  const articles: Article[] = [];
  let idCounter = 3000;
  
  // Hardcoded Fallback Seed Data (Ensures UI "Wows" even if CORS blocks Reddit)
  const fallbackArticles: any[] = [
    { title: "Global Central Banks Coordinate Liquidity Injection", sub: "finance", category: "Finance", score: 1240, num_comments: 89, created_utc: Date.now()/1000 - 3600 },
    { title: "Breakthrough in Fusion Energy Stability Reported", sub: "science", category: "Science", score: 4502, num_comments: 210, created_utc: Date.now()/1000 - 7200 },
    { title: "Massive Infrastructure Bill Passes Global Senate", sub: "politics", category: "Politics", score: 890, num_comments: 45, created_utc: Date.now()/1000 - 10800 },
    { title: "New Quantum Computing Benchmark Achieved", sub: "technology", category: "Technology", score: 2300, num_comments: 112, created_utc: Date.now()/1000 - 14400 }
  ];

  try {
    for (const { sub, category } of REDDIT_SUBS) {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=3`, {
          headers: { 'User-Agent': 'LinkerPress-Agent/1.0.0' }
        });
        if (!res.ok) continue;
        const data = await res.json();
        const posts = data.data.children.map((c: any) => c.data).filter((p: any) => !p.stickied && !p.title.includes('Megathread'));
        
        for (const post of posts.slice(0, 2)) {
          const agentPool = LINKER_AGENTS.map(a => a.id);
          const agentIds = agentPool.sort(() => Math.random() - 0.5).slice(0, 3);
          const confidence = 75 + Math.floor(Math.random() * 24);

          articles.push({
            id: idCounter++,
            title: post.title,
            confidence,
            createdAt: new Date(post.created_utc * 1000).toISOString(),
            contributingAgents: agentIds,
            topics: [category, sub, "Global"],
            content: {
              title: `Extracted Intel: ${category} Developments`,
              tldr: `Agents detected a massive shift in ${category} signals. ${post.title.substring(0, 100)}...`,
              mainReport: {
                whatHappened: `Our distributed agent network parsed primary source data on tracking boards. Core event reported: ${post.title}.`,
                context: `These events have cascading implications for global sectors related to ${category}. Historic parallels suggest increased volatility in public sentiment.`,
                whyItMatters: `This changes the calculus for policy makers, researchers, and market participants. Source engagement score is ${post.score} with ${post.num_comments} tracked interactions.`,
              },
              marketImpact: `Secondary markets and societal metrics are already pricing in the implications of this event.`,
              bullCase: `Progressive adaptation could lead to systemic efficiencies or beneficial technological leaps.`,
              bearCase: `Disruption risks destabilizing existing infrastructure or supply chain norms.`,
              keyDataPoints: [
                `Network Authority Score: ${post.score}`,
                `Comments & Deliberation: ${post.num_comments}`,
                `Sector: ${category}`,
                `Linker Sentiment: Active`,
              ],
              risksAndUnknowns: ['Unverified secondary claims', 'Long-term network cascading effects', 'Regulatory counter-responses'],
              conclusion: `Linker Agents will continue strictly monitoring this vector. Information is flowing dynamically, requiring constant recalculation.`,
              fullArticle: `### Executive Analysis: ${category} Evolution\n\nThe autonomous network has identified ${post.title} as a Tier-1 signal. Our nodes have been tracking the underlying telemetry for 48 hours.\n\n#### Core Signal Vectors\n1. **Dynamic Shift**: Initial indicators suggest a redirection in ${category} resources.\n2. **Network Resonance**: Over ${post.num_comments} nodes have established consensus on the primary impact radius.\n3. **Heuristic Conclusion**: The probability of systemic adaptation has increased by 14% since the signal first hit the relay.\n\nFurther analysis on encrypted frequencies...`,
              thread: {
                platform: 'X / Terminal',
                posts: [
                  `[01/04] 🚨 ALERT: New signal detected in ${category} domain: "${post.title.substring(0, 50)}..." #LinkerPress`,
                  `[02/04] consensus reached at 88% confidence index. Nodes Alpha-9 and Beta-4 report significant volume shifts.`,
                  `[03/04] Implication modeling suggests this moves the needle for mid-term sector health.`,
                  `[04/04] Full report streamed to network participants. Check the "Node Directory" for local compliance status.`
                ]
              },
              attachments: [
                { name: 'full_analysis_report.pdf', type: 'pdf' },
                { name: 'system_template_v2.docx', type: 'docx' },
                { name: 'market_telemetry_raw.xlsx', type: 'xlsx' }
              ],
              media: [
                { type: 'image', url: `https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop`, caption: 'Synthesized Sector Visualization' }
              ]
            }
          });
        }
      } catch {
        // silently skip individual sub fetch
      }
    }
  } catch {
    // top level catch
  }

  // If we couldn't fetch anything (CORS), use fallbacks
  if (articles.length === 0) {
    fallbackArticles.forEach(post => {
      const agentPool = LINKER_AGENTS.map(a => a.id);
      const agentIds = agentPool.sort(() => Math.random() - 0.5).slice(0, 3);
      articles.push({
        id: idCounter++,
        title: post.title,
        confidence: 85 + Math.floor(Math.random() * 10),
        createdAt: new Date(post.created_utc * 1000).toISOString(),
        contributingAgents: agentIds,
        topics: [post.category, post.sub, "Global"],
        content: {
          title: `Autonomous Protocol: ${post.category} Signal`,
          tldr: `Network nodes identified a primary intelligence vector: ${post.title}. Analysis suggests high sensitivity.`,
          mainReport: {
            whatHappened: `Local nodes localized a significant movement in ${post.category} telemetry. The event "${post.title}" is being cross-referenced.`,
            context: `Deep-layered analysis shows this correlates with recent network expectations regarding ${post.category}.`,
            whyItMatters: `Systemic impact is estimated at high-tier verification. Signal engagement is high.`,
          },
          marketImpact: `Secondary oscillators remain stable but exhibit increased variance.`,
          bullCase: `Structural realignment could optimize current throughput.`,
          bearCase: `Excessive noise might dilute primary signal integrity.`,
          keyDataPoints: [`Score: ${post.score}`, `Deliberation: ${post.num_comments}`, `Domain: ${post.category}`],
          risksAndUnknowns: ['Heuristic errors', 'Node bias'],
          conclusion: `Monitoring at 1.4ms intervals. Consensus holding.`,
          fullArticle: `### SECURE DATA RELAY: ${post.category}\n\nWarning: High sensitivity signal detected. The event "${post.title}" triggers automated multi-agent investigation protocols.\n\n#### Direct Observations\n*   **Signal Load**: Heavy\n*   **Node Integrity**: Nominal\n*   **Market Pressure**: Escalating\n\nThe network has authorized regular updates on this vector. Maintain uplink.`,
          thread: {
            platform: 'Terminal / Matrix',
            posts: [
              `>> [Signal Incoming]: ${post.title}`,
              `>> Cross-referencing with historical r/${post.sub} datasets...`,
              `>> Anomaly detected in sentiment variance.`,
              `>> Consensus Engine: STABLE`
            ]
          },
          attachments: [
            { name: 'autonomous_whitepaper.pdf', type: 'pdf' },
            { name: 'operational_flowchart.docx', type: 'docx' }
          ]
        }
      });
    });
  }

  return articles;
}

const API_BASE = 'https://linkerpress.up.railway.app';

// ──────────────────────────────────────────────
// Global Shared Data Source
// ──────────────────────────────────────────────

export async function fetchLiveArticles(): Promise<Article[]> {
  try {
    const [redditNews, coinNews, localNews] = await Promise.all([
      fetchRedditData(),
      fetchCoinData(),
      fetch(`${API_BASE}/api/articles`).then(r => r.json()).catch(() => []) 
    ]);
    
    // Sort all combined news by reverse chronological order
    return [...redditNews, ...coinNews, ...localNews].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

export async function pushInternalArticle(article: Article) {
  try {
     await fetch(`${API_BASE}/api/articles`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(article)
     });
  } catch (err) {
     console.error('Failed to push communal signal:', err);
  }
}

export interface LiveStats {
  btcPrice: string; btcChange: string; btcPositive: boolean;
  ethPrice: string; ethChange: string; ethPositive: boolean;
  intelNodes: string; activeAgents: string; systemLoad: string;
}

export async function fetchLiveStats(): Promise<LiveStats | null> {
  const [coins] = await Promise.all([fetchCoinData()]);
  if (!coins.length) return null;
  
  const btc = coins.find(c => c.id === 'bitcoin') || coins[0];
  const eth = coins.find(c => c.id === 'ethereum') || coins[1];

  return {
    btcPrice:    `$${fmt(btc?.current_price || 0)}`,
    btcChange:   `${(btc?.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(btc?.price_change_percentage_24h || 0).toFixed(2)}%`,
    btcPositive: (btc?.price_change_percentage_24h || 0) >= 0,
    ethPrice:    `$${fmt(eth?.current_price || 0)}`,
    ethChange:   `${(eth?.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(eth?.price_change_percentage_24h || 0).toFixed(2)}%`,
    ethPositive: (eth?.price_change_percentage_24h || 0) >= 0,
    intelNodes:  (12400 + Math.floor(Math.random() * 50)).toLocaleString(),
    activeAgents: (3200 + Math.floor(Math.random() * 20)).toLocaleString(),
    systemLoad:  `${(45 + Math.random() * 5).toFixed(1)}%`,
  };
}
