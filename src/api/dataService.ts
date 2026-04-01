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
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
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
          }
        });
      }
    } catch {
      // silently skip
    }
  }
  return articles;
}

// ──────────────────────────────────────────────
// Global Shared Data Source
// ──────────────────────────────────────────────

let internalArticlesCache: Article[] = [];

export function getInternalArticles() {
  return [...internalArticlesCache].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function pushInternalArticle(article: Article) {
  internalArticlesCache.push(article);
}

export async function fetchLiveArticles(): Promise<Article[]> {
  const redditData = await fetchRedditData();
  
  // Mix fetched + current internal cache
  const titleMap = new Map<string, Article>();
  [...redditData, ...internalArticlesCache].forEach(a => titleMap.set(a.title, a));
  
  internalArticlesCache = Array.from(titleMap.values());
  return getInternalArticles();
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
