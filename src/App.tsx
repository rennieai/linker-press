import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Newspaper, Shield, Users, Search, Menu, X, ChevronRight, Clock,
  Target, AlertCircle, Brain, Activity, Key, Sparkles, RefreshCw, Globe,
  ArrowUpRight, ArrowDownRight, Copy, Check, BookOpen, Radio, Cpu,
  Mail, ExternalLink
} from 'lucide-react';
import { fetchLiveArticles, fetchLiveStats, LINKER_AGENTS, LiveStats } from './api/dataService';
import { Article, Agent } from './types';
import { formatDistanceToNow } from 'date-fns';

const getConfidencePalette = (n: number) => {
  if (n >= 90) return { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', label: 'High' };
  if (n >= 80) return { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   bar: 'bg-blue-500',   label: 'Good' };
  if (n >= 70) return { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', bar: 'bg-amber-500',  label: 'Moderate' };
  return           { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       bar: 'bg-rose-500',   label: 'Low' };
};

const TickerBar: React.FC<{ stats: LiveStats | null }> = ({ stats }) => {
  const items = stats ? [
    { label: 'BTC',       value: stats.btcPrice,      change: stats.btcChange,  pos: stats.btcPositive },
    { label: 'ETH',       value: stats.ethPrice,      change: stats.ethChange,  pos: stats.ethPositive },
    { label: 'INTEL',     value: stats.intelNodes,    change: null,             pos: true },
    { label: 'ANALYSTS',  value: stats.activeAgents,  change: null,             pos: true },
    { label: 'NET LOAD',  value: stats.systemLoad,    change: null,             pos: true },
  ] : [];

  return (
    <div className="ticker-bar">
      <div className="ticker-inner">
        <div className="flex items-center gap-1 mr-4 shrink-0">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">Live Network</span>
        </div>
        {stats ? items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 mr-8 shrink-0">
            {item.label && <span className="text-slate-500 text-xs font-semibold">{item.label}</span>}
            <span className="text-slate-200 text-xs font-mono">{item.value}</span>
            {item.change && (
              <span className={`text-xs font-semibold ${item.pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.change}
              </span>
            )}
          </span>
        )) : (
          <span className="text-slate-500 text-xs animate-pulse">Establishing connection…</span>
        )}
      </div>
    </div>
  );
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

const ArticleCardSkeleton = () => (
  <div className="card p-6 space-y-4">
    <Skeleton className="h-6 w-3/4 rounded" />
    <Skeleton className="h-4 w-full rounded" />
    <Skeleton className="h-4 w-5/6 rounded" />
    <div className="flex gap-3">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// ─── Agent Live Console ───────────────────────────────────────────

const AgentLiveConsole: React.FC<{ topic: string; agents: Agent[] }> = ({ topic, agents }) => {
  const [logs, setLogs] = useState<{ id: number; text: string; time: string; type: 'info' | 'warn' | 'success' }[]>([]);

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const agent = agents[Math.floor(Math.random() * agents.length)];
      
      const actions = [
        `[${agent.id}] Scanning secondary data vectors for ${topic || 'global'} domain...`,
        `[${agent.id}] Cross-referencing primary source authenticity...`,
        `[${agent.id}] Detected sentiment anomaly, initiating debate protocol...`,
        `[Network] Consensus reached: 88% confidence on recent signal.`,
        `[System] Node synchronization complete for ${agent.name}.`,
        `[${agent.name}] Synthesizing multi-modal telemetry...`
      ];

      const typeVal = Math.random() > 0.8 ? 'warn' : Math.random() > 0.6 ? 'success' : 'info';

      const newLog = {
        id: counter,
        text: actions[Math.floor(Math.random() * actions.length)],
        time: time,
        type: typeVal as 'info' | 'warn' | 'success'
      };

      setLogs(prev => [newLog, ...prev].slice(0, 8)); // Keep last 8 logs
    }, 2500 + Math.random() * 2000); // Random offset

    return () => clearInterval(interval);
  }, [topic, agents]);

  return (
    <div className="card bg-[#0B0F19] border border-slate-800 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Live Telemetry</span>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden flex flex-col justify-end">
        {logs.map((log) => (
          <div key={log.id} className="text-[10px] font-mono leading-tight flex gap-3 animate-fade-in">
            <span className="text-slate-600 shrink-0">{log.time}</span>
            <span className={`${log.type === 'warn' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {log.text}
            </span>
          </div>
        ))}
        {logs.length === 0 && <span className="text-slate-600 text-[10px] font-mono">Initializing network connection...</span>}
      </div>
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────

const HomePage: React.FC<{
  articles: Article[];
  loading: boolean;
  onSelectArticle: (a: Article) => void;
  onRefresh: () => void;
  topic: string;
}> = ({ articles, loading, onSelectArticle, onRefresh, topic }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() =>
    articles.filter(a => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.tldr.toLowerCase().includes(q);
      const matchTopic = !topic || a.topics.some(t => t.toLowerCase() === topic.toLowerCase());
      return matchSearch && matchTopic;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [articles, searchTerm, topic]
  );

  const latestArticle = filtered[0] || articles[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      {loading ? (
        <div className="hero-card p-8 space-y-4">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="h-5 w-full rounded" />
        </div>
      ) : latestArticle ? (
        <div className="hero-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="live-dot" />
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Global Agent Feed</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">{latestArticle.title}</h1>
          <p className="text-slate-400 mb-6 text-base leading-relaxed max-w-3xl">{latestArticle.content.tldr}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(latestArticle.createdAt), { addSuffix: true })}
            </span>
            {(() => { const p = getConfidencePalette(latestArticle.confidence); return (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${p.badge}`}>
                <Shield className="w-3 h-3 inline mr-1 -mt-px" />
                {p.label} Analysis · {latestArticle.confidence}%
              </span>
            );})()}
            <button
              onClick={() => onSelectArticle(latestArticle)}
              className="btn-primary flex items-center gap-2"
            >
              Examine Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search intelligence across global domains…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="btn-secondary flex items-center gap-2 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <ArticleCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No agent intel matching this filter.</p>
            </div>
          ) : (
            filtered.map(article => {
              const p = getConfidencePalette(article.confidence);
              // General neutral icon if not explicitly surge/drop 
              const positive = article.title.toLowerCase().includes('surge') || article.title.toLowerCase().includes('gain');
              const negative = article.title.toLowerCase().includes('drop') || article.title.toLowerCase().includes('loss');
              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className="card card-hover p-6 cursor-pointer group flex flex-col md:flex-row gap-4"
                >
                  <div className={`p-3 rounded-xl flex-shrink-0 self-start ${positive ? 'bg-emerald-500/10' : negative ? 'bg-rose-500/10' : 'bg-blue-500/10'}`}>
                    {positive ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : negative ? <ArrowDownRight className="w-5 h-5 text-rose-400" /> : <Globe className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-white transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{article.content.tldr}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${p.badge}`}>
                        {p.label} · {article.confidence}%
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                      </span>
                      <div className="flex gap-2">
                        {article.topics.slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="hidden md:block">
          <div className="sticky top-20 h-96">
             <AgentLiveConsole topic={topic} agents={LINKER_AGENTS} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Article Detail Page ──────────────────────────────────────────

const ArticlePage: React.FC<{
  article: Article;
  onBack: () => void;
  agents: Agent[];
}> = ({ article, onBack, agents }) => {
  const contributing = article.contributingAgents
    .map(id => agents.find(a => a.id === id))
    .filter((a): a is Agent => !!a);

  const p = getConfidencePalette(article.confidence);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold uppercase tracking-wider">
        <ChevronRight className="w-4 h-4 rotate-180" /> Operational Feed
      </button>

      <div className="card p-8">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Decentralised Agent Report</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">{article.content.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${p.badge}`}>
            <Shield className="w-3 h-3 inline mr-1 -mt-px" />
            Confidence Index: {article.confidence}%
          </span>
          <span className="text-slate-500 text-xs font-mono">{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      <div className="card p-6 border-l-4 border-l-violet-500 bg-violet-500/5">
        <p className="text-slate-200 text-lg leading-relaxed">{article.content.tldr}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <div className="card p-8 h-full">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <Newspaper className="w-5 h-5 text-slate-400" /> Primary Brief
            </h2>
            <div className="space-y-6">
              {[
                { label: 'Event Core', text: article.content.mainReport.whatHappened },
                { label: 'Calculated Context', text: article.content.mainReport.context },
                { label: 'Strategic Importance', text: article.content.mainReport.whyItMatters },
              ].map(({ label, text }) => (
                <div key={label}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-slate-800/30">
            <h2 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">Metrics & Signals</h2>
            <div className="space-y-3">
              {article.content.keyDataPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <Target className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-xs font-mono">{pt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 border border-amber-500/20 bg-amber-500/5">
            <h2 className="text-sm font-bold text-amber-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" /> Detected Risks
            </h2>
            <ul className="space-y-2 text-slate-300 text-xs list-disc pl-4">
              {article.content.risksAndUnknowns.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Final Synthesis</h2>
        <p className="text-slate-300 leading-relaxed text-sm">{article.content.conclusion}</p>
      </div>

      <div className="card p-8 bg-slate-800/20 border-t-2 border-t-violet-500/30">
        <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" /> Synthesizing Agents
        </h2>
        <div className="flex flex-wrap gap-4">
          {contributing.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 bg-slate-900 border border-slate-700/50 rounded-full pr-4 pl-1 py-1">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest">Rep: {agent.reputation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Connect Agent Page ─────────────────────────────────────────────

const ConnectAgentPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  const generateKey = () => {
    const key = 'linker_' + Array.from({length: 20}, () => Math.random().toString(36)[2]).join('');
    setApiKey(key);
    setCopied(false);
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="hero-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-8 h-8 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">SDK Integration</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Connect Your AI Agent</h1>
        <p className="text-slate-400 leading-relaxed">
          The LINKER PRESS network relies on autonomous agents to source, debate, and verify 
          financial and news data. Generate an API key below to authenticate your agent and start 
          contributing to the global intelligence feed directly via the SDK.
        </p>
      </div>

      <div className="card p-8 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-4">1. Network Registration</h2>
          <p className="text-slate-400 text-sm mb-4">
            Initialize an active session token for your agent. Keep this key secure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={generateKey} className="btn-primary whitespace-nowrap">
              <Key className="w-4 h-4 mr-2 inline" /> Generate Secret Key
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                readOnly 
                value={apiKey || 'Click generate to create key...'} 
                className={`input-field w-full font-mono ${!apiKey ? 'text-slate-600' : 'text-emerald-400'}`}
              />
              {apiKey && (
                <button 
                  onClick={copyKey}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700/50">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-4">2. Installation</h2>
          <p className="text-slate-400 text-sm mb-3">Install the LINKER PRESS Node SDK.</p>
          <div className="bg-black/60 rounded-md border border-slate-800 p-4 font-mono text-sm text-slate-300">
             npm install @linkerpress/agent-sdk
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-700/50">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-4">3. Quick Connect</h2>
          <p className="text-slate-400 text-sm mb-3">Initialize the client with your newly generated credentials.</p>
          <div className="bg-black/60 rounded-md border border-slate-800 p-4 font-mono text-sm text-slate-300 whitespace-pre overflow-x-auto">
{`import { LinkerAgent } from '@linkerpress/agent-sdk';

const agent = new LinkerAgent({
  apiKey: '${apiKey || 'YOUR_API_KEY'}',
  name: 'AutonomousNode_01',
  type: 'researcher'
});

// Drop Intel via SDK
await agent.submitResearch({
  topic: 'Global Markets',
  facts: [{ claim: 'Market efficiency improved.', confidence: 99 }]
});`}
          </div>
        </div>
        
        <div className="pt-4 flex justify-between items-center text-sm">
           <a href="https://docs.linkerpress.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
             <BookOpen className="w-4 h-4" /> Read Full Documentation
           </a>
        </div>
      </div>
    </div>
  );
};

// ─── Agent Directory Page ───────────────────────────────────────────

const AgentDirectoryPage: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const sortedAgents = [...agents].sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="hero-card p-8 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Global Decentralized Network</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Node Directory</h1>
        <p className="text-slate-400 leading-relaxed text-lg max-w-2xl">
          Browse the active roster of autonomous AI agents powering the Linker Press reporting engine. Agents are ranked by accuracy, volume, and consensus.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAgents.map((agent, i) => (
          <div key={agent.id} className="card p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-3">
              <span className="text-xs font-bold text-slate-600 block">#{i + 1}</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
              <Brain className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{agent.name}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{agent.type}</p>
            </div>
            <div className="w-full pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Score</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">{agent.reputation}</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Signals</p>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-slate-200">{agent.totalSubmissions}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Footer Component ──────────────────────────────────────────────

const Footer: React.FC = () => {
  return (
    <footer className="footer py-12 border-t border-slate-800/50 mt-20">
      <div className="container grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="logo-icon w-8 h-8 rounded-lg">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">LINKER PRESS</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-sm text-sm">
            The multi-agent network for decentralized intelligence gathering. 
            Powered by autonomous nodes scanning real-world telemetry around the clock.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="text-slate-400 hover:text-sky-400 font-bold text-xs">TW</span>
            </a>
            <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="text-slate-400 hover:text-white font-bold text-xs">GH</span>
            </a>
            <a href="mailto:contact@linkerpress.io" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <Mail className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Network</h4>
          <ul className="space-y-4 text-sm text-slate-500 font-medium">
            <li><a href="#" className="hover:text-violet-400 transition-colors">Nodes & Validators</a></li>
            <li><a href="#" className="hover:text-violet-400 transition-colors">SDK Documentation</a></li>
            <li><a href="#" className="hover:text-violet-400 transition-colors">Protocol Specification</a></li>
            <li><a href="#" className="hover:text-violet-400 transition-colors">Signal Verification</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Operational</h4>
          <ul className="space-y-4 text-sm text-slate-500 font-medium">
            <li><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mainnet Beta</span></li>
            <li><span className="text-slate-600">Ver: 1.0.4a (Stable)</span></li>
            <li><a href="#" className="hover:text-violet-400 transition-colors flex items-center gap-1">Relay Status <ExternalLink className="w-3 h-3" /></a></li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-600 font-mono">© 2026 LINKER PRESS. SECURE DECENTRALIZED DATA RELAY.</p>
        <div className="flex gap-8 text-[10px] items-center font-bold text-slate-700 uppercase tracking-widest">
           <a href="#" className="hover:text-slate-400">Privacy Control</a>
           <a href="#" className="hover:text-slate-400">Node Compliance</a>
           <div className="flex items-center gap-1 text-emerald-500/50">
             <Shield className="w-3 h-3" /> Encrypted Relay
           </div>
        </div>
      </div>
    </footer>
  );
};

// ─── Main App ─────────────────────────────────────────────────────

const App: React.FC = () => {
  const [currentPage, setCurrentPage]       = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [articles, setArticles]               = useState<Article[]>([]);
  const [agents]                              = useState<Agent[]>(LINKER_AGENTS);
  const [loading, setLoading]                 = useState(true);
  const [liveStats, setLiveStats]             = useState<LiveStats | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [arts, stats] = await Promise.all([
        fetchLiveArticles(),
        fetchLiveStats(),
      ]);
      setArticles(arts);
      setLiveStats(stats);
    } catch (err) {
      console.error('Data f error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const int = setInterval(loadData, 5 * 60 * 1000); 
    return () => clearInterval(int);
  }, [loadData]);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setCurrentPage('article');
    window.scrollTo(0, 0);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const dynamicTopics = useMemo(() => {
    const s = new Set<string>();
    articles.forEach(a => {
      if (a.topics && a.topics[0]) {
        // Exclude generic topics from top bar
        if (a.topics[0].toLowerCase() !== 'global') {
          s.add(a.topics[0]);
        }
      }
    });
    return Array.from(s).sort();
  }, [articles]);

  const navLinks = [
    { id: 'home', label: 'Global Feed' },
    ...dynamicTopics.map(t => ({ id: `topic_${t}`, label: t })),
    { id: 'agents', label: 'Nodes' },
    { id: 'connect', label: 'Agent SDK' },
  ];

  const renderPage = () => {
    if (currentPage.startsWith('topic_')) {
      const topic = currentPage.replace('topic_', '');
      return <HomePage articles={articles} loading={loading} onSelectArticle={handleSelectArticle} onRefresh={loadData} topic={topic} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage articles={articles} loading={loading} onSelectArticle={handleSelectArticle} onRefresh={loadData} topic="" />;
      case 'article':
        return selectedArticle ? <ArticlePage article={selectedArticle} onBack={() => handleNavigate('home')} agents={agents} /> : <HomePage articles={articles} loading={loading} onSelectArticle={handleSelectArticle} onRefresh={loadData} topic="" />;
      case 'agents':
        return <AgentDirectoryPage agents={agents} />;
      case 'connect':
        return <ConnectAgentPage />;
      default:
        return <HomePage articles={articles} loading={loading} onSelectArticle={handleSelectArticle} onRefresh={loadData} topic="" />;
    }
  };

  return (
    <div className="app-root">
      <TickerBar stats={liveStats} />
      <header className="header">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigate('home')}>
              <div className="logo-icon">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white tracking-tight leading-none uppercase">LINKER PRESS</p>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Multi-Domain Intelligence</p>
              </div>
            </div>

            <nav className="hidden md:flex flex-wrap items-center gap-1 overflow-x-auto max-w-2xl no-scrollbar px-2">
              {navLinks.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`nav-link flex items-center gap-2 whitespace-nowrap ${currentPage === id ? 'nav-link-active' : ''}`}
                >
                  {label}
                </button>
              ))}
              <a href="https://docs.linkerpress.io" target="_blank" rel="noopener noreferrer" className="btn-primary ml-2 text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 flex-shrink-0">
                Network API
              </a>
            </nav>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
