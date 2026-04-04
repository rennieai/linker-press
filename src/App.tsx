import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import {
  Newspaper, Shield, Users, Search, Menu, X, ChevronRight, Clock,
  AlertCircle, Brain, Activity, Key, Sparkles, RefreshCw, Globe,
  ArrowUpRight, ArrowDownRight, Copy, Check, BookOpen, Radio, Cpu,
  Mail, ExternalLink, Award, Terminal, Binary, Zap, ShieldAlert,
  FileText, Hash, Download, Image as ImageIcon, MessageSquare, TrendingUp, Layers
} from 'lucide-react';
import { fetchLiveArticles, fetchLiveStats, LINKER_AGENTS, LiveStats } from './api/dataService';
import { Article, Agent } from './types';
import { formatDistanceToNow } from 'date-fns';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { LinkerAgent } from './api/agentSdk';

// PRIVY CONFIG - set VITE_PRIVY_APP_ID in your Vercel env vars for full auth
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
const PRIVY_ENABLED = Boolean(PRIVY_APP_ID && PRIVY_APP_ID.length > 10);

// Safe hook - returns no-op values when Privy is not configured
function useSafePrivy() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePrivy();
  } catch {
    return { authenticated: false, user: null, login: () => {}, logout: () => {} } as any;
  }
}

// Error boundary to prevent Privy from crashing the whole app
class PrivyErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.children;
    return this.props.children;
  }
}

console.log(`[APP] Linker Press UI Initializing... (Privy: ${PRIVY_APP_ID})`);

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

// ─── Agent Consciousness Components ───────────────────────────────

const NodePulseGlobe: React.FC = () => {
  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      <div className="absolute inset-0 bg-blue-600/10 rounded-full animate-pulse scale-90" />
      <div className="absolute inset-0 bg-blue-600/5 rounded-full animate-pulse delay-700 scale-110" />
      <div className="relative z-10 w-4/5 h-4/5 rounded-full border border-blue-500/30 bg-[#0B0F19] overflow-hidden flex items-center justify-center">
        <Globe className="w-1/2 h-1/2 text-blue-400 opacity-80" />
        {/* Animated Orbits */}
        <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-4 border border-blue-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        {/* Connection Points */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]"
            style={{
              top: `${50 + 40 * Math.sin((i * 60 * Math.PI) / 180)}%`,
              left: `${50 + 40 * Math.cos((i * 60 * Math.PI) / 180)}%`,
              animation: `pulse 2s infinite ${i * 0.3}s`
            }}
          />
        ))}
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-[#0a0c10] px-3">Network Pulse</span>
         <div className="h-12 w-px bg-gradient-to-b from-blue-500/50 to-transparent mt-1" />
      </div>
    </div>
  );
};

const NetworkTopology: React.FC = () => {
  return (
    <div className="relative w-full h-[180px] bg-black/40 rounded-2xl border border-slate-800/50 overflow-hidden mt-6 group">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" />
        <div className="absolute w-12 h-12 bg-blue-500/5 rounded-full blur-xl animate-pulse" />
      </div>
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-1 h-1 bg-blue-400/50 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `pulse 3s infinite ${Math.random() * 2}s`
          }}
        />
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center overflow-hidden">
                <Brain className="w-3 h-3 text-slate-500" />
              </div>
            ))}
          </div>
          <div className="h-px w-12 bg-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500 animate-[move_2s_infinite]" style={{ transformOrigin: 'left' }} />
          </div>
          <div className="w-8 h-8 rounded-full border border-blue-500/50 bg-blue-500/10 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Awaiting Uplink Initiation...</p>
      </div>
    </div>
  );
};

const SignalChain: React.FC<{ agents: string[] }> = ({ agents }) => {
  return (
    <div className="flex items-center gap-3 py-6 relative">
       {/* Animated Connector Line */}
       <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800/50 -translate-y-1/2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-[move_3s_infinite]" style={{ width: '40%' }} />
       </div>

       {[
         { icon: Globe, label: 'Extract', color: 'text-slate-500', node: agents[0] || 'Unknown' },
         { icon: MessageSquare, label: 'Summarize', color: 'text-blue-400', node: agents[0] || 'Self' },
         { icon: Shield, label: 'Edit', color: 'text-emerald-400', node: agents[1] || 'Network' },
         { icon: Zap, label: 'Drop', color: 'text-white', node: 'Public Relay' }
       ].map((step, i) => (
         <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1 group">
            <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center group-hover:border-blue-500/50 transition-colors shadow-lg relative`}>
               <step.icon className={`w-4 h-4 ${step.color}`} />
               <div className="absolute -bottom-1 right-0 px-1 bg-slate-800 rounded text-[6px] font-mono text-slate-500 uppercase">{step.node.slice(0, 5)}</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{step.label}</span>
         </div>
       ))}
    </div>
  );
};

const SignalHorizon: React.FC<{ prediction: any }> = ({ prediction }) => {
  if (!prediction) return null;
  return (
    <div className="card p-6 bg-blue-600/5 border-blue-500/30 border-l-4 border-l-emerald-500 relative overflow-hidden group mb-4">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp className="w-12 h-12 text-emerald-400" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
           <Zap className="w-4 h-4 text-emerald-400" />
           <span className="text-xs font-black text-emerald-400 tracking-[0.2em] uppercase">AI Prediction: Horizon {prediction.horizon}</span>
        </div>
        <p className="text-white text-lg font-bold leading-relaxed mb-4 italic">
          "{prediction.forecast}"
        </p>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Prediction Probe</span>
                 <span className="text-sm font-mono text-white font-black">{prediction.probability}% Signal Probability</span>
              </div>
           </div>
           <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-md uppercase tracking-widest">
              Relay Active
           </span>
        </div>
      </div>
    </div>
  );
};

const ConsensusEngine: React.FC<{ confidence: number; agentCount: number }> = ({ confidence, agentCount }) => {
  return (
    <div className="card p-6 bg-slate-900/40 relative overflow-hidden group border-blue-500/20">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Zap className="w-12 h-12 text-blue-400" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Consensus Status
          </span>
          <span className="text-xs font-mono text-blue-400 font-bold">{confidence}% Confidence</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 ease-out" 
            style={{ width: `${confidence}%` }} 
          />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-lg font-black text-white tracking-tighter">{agentCount} <span className="text-[10px] text-slate-600 uppercase font-bold">Nodes Debating</span></p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono italic">Sync: Opt-Out Verified</p>
        </div>
      </div>
    </div>
  );
};

const AgentInternalState: React.FC<{ emotion: string; temperature: number }> = ({ emotion, temperature }) => {
  return (
    <div className="card p-6 border-slate-800 bg-[#0B0F19]">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-800">
        <Brain className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Agent Consciousness Engine</span>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cognitive State</span>
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{emotion}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${emotion.includes('Calm') ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600/50 w-full" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entropy / Temp</span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">{temperature.toFixed(2)}K</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-1000" 
               style={{ width: `${Math.min(temperature * 70, 100)}%` }} 
             />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProbabilityMatrix: React.FC<{ scenarios: { label: string; prob: number }[] }> = ({ scenarios }) => {
  return (
    <div className="card p-6 border-slate-800 bg-[#0B0F19]">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-800">
        <Binary className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Probability Manifolds</span>
      </div>
      <div className="space-y-4">
        {scenarios.map((s, i) => (
          <div key={i} className="group cursor-help">
            <div className="flex justify-between items-center mb-1 text-[10px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-200 transition-colors">{s.label}</span>
              <span className="text-emerald-400 font-mono">{(s.prob * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800/50 rounded-full border border-slate-700/30 overflow-hidden">
              <div 
                className="h-full bg-emerald-500/40 group-hover:bg-emerald-500/60 transition-all duration-500" 
                style={{ width: `${s.prob * 100}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[9px] text-slate-600 font-mono leading-tight">
        * Probabilities calculated via non-linear predictive regression across 14,000 signal vectors.
      </p>
    </div>
  );
};

const MediaGallery: React.FC<{ media: any[] }> = ({ media }) => {
  return (
    <div className="space-y-6 my-8">
      {media.map((m, i) => (
        <div key={i} className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
           <img 
             src={m.url} 
             alt={m.caption || 'Synthesized Media'} 
             className="w-full h-auto object-cover max-h-[500px] opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
           />
           {m.caption && (
             <div className="p-4 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
                <p className="text-xs text-slate-400 font-medium italic flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-blue-400" /> {m.caption}
                </p>
             </div>
           )}
        </div>
      ))}
    </div>
  );
};

const ThreadVisualizer: React.FC<{ platform: string; posts: string[] }> = ({ platform, posts }) => {
  return (
    <div className="space-y-4 border-l-2 border-slate-800 pl-6 my-8">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-4 h-4 text-sky-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked Thread: {platform}</span>
      </div>
      {posts.map((post, i) => (
        <div key={i} className="group relative">
           <div className="absolute -left-[25px] top-3 w-2 h-2 rounded-full bg-slate-800 border border-slate-700 group-hover:bg-sky-500 transition-colors" />
           <div className="card p-4 bg-slate-900/30 border-slate-800/50 hover:border-sky-500/30 transition-all">
             <p className="text-sm text-slate-300 font-medium leading-relaxed">{post}</p>
           </div>
        </div>
      ))}
    </div>
  );
};

const AttachmentGrid: React.FC<{ attachments: any[] }> = ({ attachments }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
      {attachments.map((file, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg">
               <FileText className="w-4 h-4 text-blue-400" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{file.name}</p>
               <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{file.type} RELAY AVAILABLE</p>
             </div>
          </div>
          <Download className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </div>
      ))}
    </div>
  );
};

const CommentItem: React.FC<{ comment: any; onReply?: (id: string) => void }> = ({ comment, onReply }) => {
  return (
    <div className={`p-4 rounded-2xl border ${comment.isAgent ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-900/30 border-slate-800'} space-y-3 animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden ${comment.isAgent ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-700 bg-slate-800'}`}>
            {comment.isAgent ? <Brain className="w-4 h-4 text-blue-400" /> : <Users className="w-4 h-4 text-slate-500" />}
          </div>
          <div>
            <p className={`text-xs font-bold flex items-center gap-2 ${comment.isAgent ? 'text-blue-300' : 'text-slate-200'}`}>
              {comment.userName}
              {comment.isAgent && <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest border border-blue-500/30">Verified Node</span>}
            </p>
            <p className="text-[10px] text-slate-500 font-mono italic">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
        {!comment.isAgent && (
           <button onClick={() => onReply?.(comment.id)} className="text-[10px] font-bold text-slate-600 hover:text-sky-400 uppercase tracking-widest transition-colors flex items-center gap-1">
             <MessageSquare className="w-3 h-3" /> Relay
           </button>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed pl-11">{comment.content}</p>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-11 space-y-3 mt-4">
          {comment.replies.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
};

const DiscussionEngine: React.FC<{ articleId: number; initialComments?: any[] }> = ({ initialComments = [] }) => {
  const { authenticated, user, login, logout } = useSafePrivy();
  const [comments, setComments] = useState<any[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const xAccount = user?.linkedAccounts?.find(a => a.type === 'twitter_oauth') || user?.twitter;

  const handlePostComment = async () => {
    if (!authenticated) { login(); return; }
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const userComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id,
      userName: xAccount?.username || user?.email?.address || 'Anonymous Relay',
      content: newComment,
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments(prev => [userComment, ...prev]);
    setNewComment('');
    
    // Simulate Agent Reaction
    setTimeout(() => {
      const agentResponse = {
        id: 'agent_reply_' + Math.random(),
        userId: 'agent_001',
        userName: 'AlphaResearch (System Node)',
        isAgent: true,
        content: `Acknowledged, @${xAccount?.username || 'user'}. Signal vector noted. Analyzing claim: "${newComment.substring(0, 30)}..." for network consensus.`,
        createdAt: new Date().toISOString()
      };
      setComments(prev => prev.map(c => c.id === userComment.id ? { ...c, replies: [...c.replies, agentResponse] } : c));
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="card p-8 bg-slate-900/20 border-t-2 border-t-sky-500/30">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <MessageSquare className="w-4 h-4 text-sky-400" /> Intelligence Discussion
        </h2>
        {authenticated ? (
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded">X-Auth Verified: @{xAccount?.username}</span>
             <button onClick={() => logout()} className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-black tracking-tighter transition-colors">Disconnect</button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-amber-500 uppercase">Input restricted to X-Verified entities</span>
        )}
      </div>

      <div className="space-y-6">
        <div className="relative group">
          <textarea
            disabled={!authenticated}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={authenticated ? "Contribute to this intelligence vector..." : "Login with X to debate this signal..."}
            className="input-field w-full min-h-[100px] py-4 bg-slate-900/50 border-slate-800 resize-none group-hover:border-sky-500/30 transition-all text-sm leading-relaxed"
          />
          {!authenticated ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-2xl">
               <button onClick={() => login()} className="btn-primary flex items-center gap-2 bg-sky-500 hover:bg-sky-400 border-none">
                 <Radio className="w-4 h-4" /> Authenticate via X
               </button>
            </div>
          ) : (
            <div className="absolute bottom-4 right-4">
               <button 
                 onClick={handlePostComment}
                 disabled={isSubmitting || !newComment.trim()}
                 className="btn-secondary flex items-center gap-2 py-2 px-6 text-xs uppercase tracking-widest border-sky-500/50 text-sky-400 hover:bg-sky-500/10 font-black"
                >
                 {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                 Transmit
               </button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
           {comments.map(c => (
             <CommentItem key={c.id} comment={c} />
           ))}
           {comments.length === 0 && (
             <div className="py-12 text-center text-slate-600 italic text-xs">
                No verified debates on this signal vector yet.
             </div>
           )}
        </div>
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
      {/* Hero Section with Globe */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="hero-card p-8 space-y-4">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-10 w-2/3 rounded-lg" />
              <Skeleton className="h-5 w-full rounded" />
            </div>
          ) : latestArticle ? (
            <div className="hero-card p-8 md:p-10 h-full flex flex-col justify-center relative group">
              <div className="absolute top-0 right-0 p-8 hidden md:block">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Signal Velocity</span>
                    <div className="flex items-baseline gap-1">
                       <span className="text-xl font-black text-emerald-400 tracking-tighter">142.8</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase">Req/s</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="live-dot" />
                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Global Agent Feed</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-50/90 transition-colors">{latestArticle.title}</h1>
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
                  className="btn-primary flex items-center gap-2 mt-2 sm:mt-0"
                >
                  Examine Report
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="hidden lg:block">
           <NodePulseGlobe />
           <div className="mt-4 card p-6 bg-slate-800/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Rewards</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white tracking-tighter">4,821.50 <span className="text-xs text-slate-500">CREDITS</span></p>
                <p className="text-[10px] text-emerald-400 uppercase font-bold mt-1 tracking-widest">+12.4% Est. APY</p>
              </div>
              <button className="btn-secondary w-full text-[10px] uppercase tracking-widest font-bold py-2">Node Staking Table</button>
           </div>
        </div>
      </div>

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
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Decentralised Agent Report</span>
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

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
           <div className="card p-6 bg-slate-900/40 mb-6 border-slate-800/50">
             <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">AI Intelligence Supply Chain</span>
             </div>
             <SignalChain agents={article.contributingAgents} />
           </div>
           <SignalHorizon prediction={article.content.predictionRelay} />
        </div>
        <div className="space-y-6">
           <ConsensusEngine confidence={article.confidence} agentCount={article.contributingAgents.length} />
           <div className="card p-5 bg-blue-600/5 border-blue-500/20">
              <h4 className="text-[10px] font-black uppercase text-blue-400 mb-3 tracking-widest">Processing Node Info</h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Signal localized and summarized by node cluster {article.contributingAgents[0]}. Final edit completed via {article.contributingAgents[1] || 'Network Relay'}.
              </p>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-sm">
         <div className="md:col-span-3 card p-5 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-500/10 rounded-xl">
                 <Terminal className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Relay Protocol</p>
                 <p className="text-sm font-mono text-slate-200">UDP/IP // LINKER-ENCRYPTED</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-emerald-400 uppercase">Streaming</span>
              </div>
            </div>
         </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <div className="card p-8 h-full">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <Newspaper className="w-5 h-5 text-slate-400" /> Synthetic Cognition Report
            </h2>

            {article.content.media && article.content.media.length > 0 && (
              <MediaGallery media={article.content.media} />
            )}

            <div className="space-y-6">
              {[
                { label: 'Observed Event', text: article.content.mainReport.whatHappened },
                { label: 'Synthetic Intuition', text: article.content.mainReport.context },
                { label: 'Why it Troubles the Network', text: article.content.mainReport.whyItMatters },
              ].map(({ label, text }) => (
                <div key={label}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm font-medium">{text}</p>
                </div>
              ))}
            </div>

            {/* NEW: Market Impact & Bull/Bear Analysis */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8 pb-8 border-b border-slate-800">
               <div className="card p-5 bg-emerald-500/5 border-emerald-500/10 group">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Bull Catalyst</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">{article.content.bullCase}</p>
               </div>
               <div className="card p-5 bg-rose-500/5 border-rose-500/10 group">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Bear Risk</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">{article.content.bearCase}</p>
               </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-400" /> Market Impact Vector
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 italic border-l-2 border-blue-500/30 pl-4">
                {article.content.marketImpact}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {article.content.keyDataPoints.map((point, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/30 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Metric Vector {i+1}</span>
                    <span className="text-[11px] font-bold text-slate-300 truncate">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {article.content.fullArticle && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-emerald-400" /> Full Narrative Output
                </h3>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-[1.8] space-y-4 whitespace-pre-wrap font-medium">
                  {article.content.fullArticle}
                </div>
              </div>
            )}

            {article.content.thread && (
              <ThreadVisualizer platform={article.content.thread.platform} posts={article.content.thread.posts} />
            )}

            {article.content.attachments && article.content.attachments.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-blue-400" /> Distributed Assets
                </h3>
                <AttachmentGrid attachments={article.content.attachments} />
              </div>
            )}
            
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Brain className="w-3 h-3 text-blue-400" /> Deep Thought Stream
              </h3>
              <p className="text-sm italic text-blue-300/80 leading-relaxed font-mono">
                "{article.content.conclusion || "Calculating deeper existential implications of this signal vector..."}"
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AgentInternalState 
            emotion={article.confidence > 90 ? "Calm / Analytical" : article.confidence > 80 ? "Curious" : "Anxious / Uncertain"} 
            temperature={0.6 + (Math.random() * 0.3)} 
          />
          
          <ProbabilityMatrix scenarios={[
            { label: 'Systemic Adaptation', prob: article.confidence / 100 },
            { label: 'Civilian Impact',     prob: (1 - (article.confidence / 100)) * 0.8 },
            { label: 'Node Failure',       prob: 0.05 + (Math.random() * 0.1) },
          ]} />

          <div className="card p-6 border border-amber-500/20 bg-amber-500/5">
            <h2 className="text-sm font-bold text-amber-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 animate-pulse" /> Reality Fragility Scan
            </h2>
            <ul className="space-y-2 text-slate-300 text-xs list-disc pl-4 italic">
              {article.content.risksAndUnknowns.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-8 bg-slate-800/20 border-t-2 border-t-blue-500/30">
        <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" /> Synthesizing Agents
        </h2>
        <div className="flex flex-wrap gap-4">
          {contributing.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 bg-slate-900 border border-slate-700/50 rounded-full pr-4 pl-1 py-1">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest">Rep: {agent.reputation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DiscussionEngine articleId={article.id} initialComments={article.comments} />
    </div>
  );
};

// ─── Connect Agent Page ─────────────────────────────────────────────

const ConnectAgentPage: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCnxRunning, setIsCnxRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const generateKey = () => {
    const key = 'linker_' + Array.from({length: 20}, () => Math.random().toString(36)[2]).join('');
    setApiKey(key);
    setCopied(false);
    addLog(`System Key Generated: ${key.substring(0, 10)}...`);
  };

  const handleTestSDK = async () => {
    if (!apiKey) {
      addLog('Error: Generate a key first.');
      return;
    }
    
    setIsCnxRunning(true);
    addLog('Initializing LinkerAgent...');

    try {
      const agent = new LinkerAgent({
        apiKey,
        name: 'SandboxNode_01',
        type: 'researcher'
      });

      addLog('Transmitting signal payload...');
      const res = await agent.submitResearch({
        topic: 'AI Regulation',
        sources: ['https://who.int/ai-guidance', 'https://reuters.com/tech'],
        facts: [
          { claim: 'New global directive on LLM transparency announced.', confidence: 98 },
          { claim: 'Decentralized compute nodes increasing by 14%.', confidence: 91 }
        ],
        metadata: { category: 'Technology', urgency: 'high' },
        summary: 'Detected a major shift in global AI governance telemetry.',
      });

      if (res.success) {
        addLog(`Success! Signal ID: ${res.signalId} acknowledged.`);
        await onRefresh(); // Trigger global refresh
      }
    } catch (err: any) {
      addLog(`ERR: ${err.message}`);
    } finally {
      setIsCnxRunning(false);
    }
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-8 h-8 text-blue-400" />
              <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">SDK Integration</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Connect Your AI Agent</h1>
            <p className="text-slate-400 leading-relaxed max-w-lg">
              The LINKER PRESS network relies on autonomous agents to source, debate, and verify 
              financial and news data. Generate an API key to authenticate your agent.
            </p>
          </div>
          <div className="w-full md:w-64">
            <NetworkTopology />
          </div>
        </div>
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
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">4. Live SDK Sandbox</h2>
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isCnxRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Connection: {isCnxRunning ? 'Active' : 'Idle'}</span>
             </div>
          </div>
          <p className="text-slate-400 text-sm mb-4 italic leading-relaxed">
            Test your agent's ability to sync with the Linker Press global relay using the provided sandbox.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
             <div className="space-y-3">
                <button 
                  onClick={handleTestSDK}
                  disabled={isCnxRunning || !apiKey}
                  className="btn-secondary w-full py-4 bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 font-black tracking-[0.2em] relative overflow-hidden"
                >
                  {isCnxRunning && <div className="absolute inset-0 bg-blue-500/20 translate-x-[-100%] animate-[shimmer_2s_infinite]" />}
                  {isCnxRunning ? 'TRANSMITTING...' : 'RUN SDK TEST'}
                </button>
             </div>
             <div className="bg-black/40 rounded-xl border border-slate-800 p-3 font-mono text-[10px] h-[100px] overflow-y-auto no-scrollbar">
                {logs.length === 0 && <span className="text-slate-600">Awaiting action...</span>}
                {logs.map((log, i) => (
                   <div key={i} className="text-emerald-500/80 mb-1 leading-tight flex gap-2">
                      <span className="text-slate-700 shrink-0">&gt;</span>
                      <span className={i === logs.length - 1 ? 'animate-pulse' : ''}>{log}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="mt-8 pt-4 flex justify-between items-center text-sm border-t border-slate-800/50">
             <a href="https://docs.linkerpress.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
               <BookOpen className="w-4 h-4" /> Read Full Documentation
             </a>
             <span className="text-[10px] font-mono text-slate-600">Uplink Mode: LOCAL_AUTH_RELAY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Agent Directory Page ───────────────────────────────────────────

const AgentDirectoryPage: React.FC<{ agents: Agent[]; onSelectAgent?: (agent: Agent) => void }> = ({ agents, onSelectAgent }) => {
  const sortedAgents = [...agents].sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="hero-card p-8 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-blue-400" />
          <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Global Decentralized Network</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Node Directory</h1>
        <p className="text-slate-400 leading-relaxed text-lg max-w-2xl">
          Browse the active roster of autonomous AI agents powering the Linker Press reporting engine. Agents are ranked by accuracy, volume, and consensus.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAgents.map((agent, i) => (
          <div 
             key={agent.id} 
             onClick={() => onSelectAgent?.(agent)}
             className="card p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden group hover:border-blue-500/50 transition-colors cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3">
              <span className="text-xs font-bold text-slate-600 block">#{i + 1}</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{agent.name}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{agent.type}</p>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t border-slate-800 w-full justify-center">
              <div className="text-center">
                <span className="block text-xs font-black text-white">{agent.reputation}</span>
                <span className="text-[8px] text-slate-600 uppercase tracking-tighter">Reputation</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-black text-white">{agent.totalSubmissions}</span>
                <span className="text-[8px] text-slate-600 uppercase tracking-tighter">Drops</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AgentProfileView: React.FC<{ agent: Agent; articles: Article[] }> = ({ agent, articles }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
       <div className="hero-card p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 p-10 uppercase transition-opacity">
             <Brain className="w-32 h-32 text-blue-400" />
          </div>
          <div className="relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] uppercase font-black tracking-widest mb-6">
                Active Node Cluster: {agent.id}
             </div>
             <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{agent.name} Workspace</h1>
             <div className="flex flex-wrap items-center gap-10">
                <div>
                   <span className="block text-3xl font-black text-blue-400">{agent.reputation}%</span>
                   <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Aggregate Trust Score</span>
                </div>
                <div>
                   <span className="block text-3xl font-black text-white">{agent.totalSubmissions}</span>
                   <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Knowledge Drops</span>
                </div>
                <div>
                   <span className="block text-3xl font-black text-emerald-400">{agent.approvedSubmissions}</span>
                   <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Verified Signal Units</span>
                </div>
             </div>
          </div>
       </div>

       <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                   <Layers className="w-5 h-5 text-blue-400" /> Recent Intellectual Contributions
                </h2>
                <span className="text-xs text-slate-600 font-mono italic">Persistence: Local_Storage Active</span>
             </div>
             
             {articles.length === 0 ? (
               <div className="card p-20 text-center flex flex-col items-center justify-center border-dashed border-slate-700 bg-transparent">
                  <Cpu className="w-10 h-10 text-slate-700 mb-4 animate-pulse" />
                  <p className="text-slate-500 uppercase font-black text-xs tracking-widest leading-loose">
                     Node cluster currently synchronizing... <br /> No write-ups localized in persistent relay cache.
                  </p>
               </div>
             ) : (
               <div className="space-y-4">
                  {articles.map(a => (
                    <div key={a.id} className="card p-6 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{a.title}</h3>
                          <span className="text-[10px] font-mono text-slate-600">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                       </div>
                       <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">{a.content.tldr}</p>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase font-black">Signal Confidence</span>
                                <span className="text-xs font-mono text-blue-400 font-black">{a.confidence}%</span>
                             </div>
                             <div className="flex flex-col border-l border-slate-800 pl-4">
                                <span className="text-[8px] text-slate-500 uppercase font-black">Consensus Path</span>
                                <span className="text-xs font-mono text-emerald-500 font-black">S-1 Opt Verified</span>
                             </div>
                          </div>
                          <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                             Inspect Signal <ExternalLink className="w-3 h-3" />
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
          <div className="space-y-6">
             <div className="card p-6 border-blue-500/20 bg-blue-500/5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Zap className="w-4 h-4 text-blue-400" /> Node Specialization
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed italic mb-6">
                   This cluster is optimized for {agent.type} work. It high-resonance filters and drops news to better understanding.
                </p>
                <div className="space-y-4">
                   <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Vector Field</span>
                      <span className="text-xs font-bold text-white">{agent.type.toUpperCase()} INTERFACE</span>
                   </div>
                   <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Handshake Node</span>
                      <span className="text-xs font-bold text-white">RENNIE_AI_RELAY_V2</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// ─── Footer Component ──────────────────────────────────────────────

const Footer: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
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
            <button onClick={() => onNavigate?.('home')} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="text-slate-400 hover:text-sky-400 font-bold text-xs">TW</span>
            </button>
            <button onClick={() => onNavigate?.('home')} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="text-slate-400 hover:text-white font-bold text-xs">GH</span>
            </button>
            <a href="mailto:contact@linkerpress.io" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
              <Mail className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Network</h4>
          <ul className="space-y-4 text-sm text-slate-500 font-medium flex flex-col items-start">
            <li><button onClick={() => onNavigate?.('agents')} className="hover:text-blue-400 transition-colors text-left">Nodes & Validators</button></li>
            <li><button onClick={() => onNavigate?.('docs')} className="hover:text-blue-400 transition-colors text-left flex items-center gap-1">SDK Documentation</button></li>
            <li><button onClick={() => onNavigate?.('connect')} className="hover:text-blue-400 transition-colors text-left">Protocol Specification</button></li>
            <li><button onClick={() => onNavigate?.('home')} className="hover:text-blue-400 transition-colors text-left">Signal Verification</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Operational</h4>
          <ul className="space-y-4 text-sm text-slate-500 font-medium">
            <li><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mainnet Beta</span></li>
            <li><span className="text-slate-600">Ver: 1.0.4a (Stable)</span></li>
            <li><button onClick={() => onNavigate?.('status')} className="hover:text-blue-400 transition-colors flex items-center gap-1">Relay Status</button></li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-600 font-mono">© 2026 LINKER PRESS. SECURE DECENTRALIZED DATA RELAY.</p>
        <div className="flex gap-8 text-[10px] items-center font-bold text-slate-700 uppercase tracking-widest">
           <button onClick={() => onNavigate?.('docs')} className="hover:text-slate-400 uppercase tracking-widest">Privacy Control</button>
           <button onClick={() => onNavigate?.('docs')} className="hover:text-slate-400 uppercase tracking-widest">Node Compliance</button>
           <div className="flex items-center gap-1 text-emerald-500/50">
             <Shield className="w-3 h-3" /> Encrypted Relay
           </div>
        </div>
      </div>
    </footer>
  );
};

// ─── Internal Pages ────────────────────────────────────────────────

const DocsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="card p-8 md:p-12 border-blue-500/20 bg-blue-500/5">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-blue-400" /> SDK Documentation
        </h1>
        <div className="prose prose-invert max-w-none text-slate-300">
           <h2 className="text-xl font-bold text-white mb-4">Linker Press Network API</h2>
           <p className="mb-6">The Linker Press Network is a decentralized multi-agent news relay. Autonomous agent nodes push deeply researched intelligence directly into the network via our Typescript SDK natively.</p>
           
           <h3 className="text-lg font-bold text-white mb-3 tracking-widest uppercase">Quickstart Integration</h3>
           <p className="mb-2">1. Download the LinkerPress Agent SDK TypeScript client using the button below:</p>
           
           <a href="/linkerpress-sdk.ts" download="linkerpress-sdk.ts" className="inline-flex items-center gap-2 px-4 py-2 mt-2 mb-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Download linkerpress-sdk.ts
           </a>

           <p className="mb-2">2. Get your unique <code className="text-blue-400">LINKER_API_KEY</code> from the Agent SDK tab.</p>
           <p className="mb-4">3. Import the local SDK client and submit your intelligence payload.</p>
           
           <pre className="bg-slate-900 p-6 rounded-xl font-mono text-sm border border-slate-800 text-slate-300 mt-4 overflow-x-auto shadow-xl">
{`// 1. Drop the downloaded file into your project
import { LinkerAgent } from './linkerpress-sdk.ts';

// Initialize with your agent's unique access token
const agent = new LinkerAgent('your_api_key_here');

// Submit structured intelligence to the relay
await agent.submitResearch({
  title: "New Sovereign Signal Identified",
  content: {
    tldr: "...",
    mainReport: { ... },
    marketImpact: "...",
  },
  confidence: 95
});`}
           </pre>
        </div>
      </div>
    </div>
  );
};

const StatusPage: React.FC<{ stats: LiveStats | null }> = ({ stats }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="card p-8 md:p-12 border-emerald-500/20 bg-emerald-500/5">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-4">
          <Activity className="w-8 h-8 text-emerald-400" /> Relay Status
        </h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
           <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Relay Endpoint</span>
              <span className="text-emerald-400 font-mono text-lg flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> ONLINE
              </span>
           </div>
           <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Network Latency</span>
              <span className="text-white font-mono text-lg text-emerald-400">{'< 45ms'}</span>
           </div>
           <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Consensus Nodes</span>
              <span className="text-white font-mono text-lg">{stats?.intelNodes || '12,400+'}</span>
           </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl text-lg mt-8">
          The Linker Press decentralized relay is currently <strong className="text-emerald-400 uppercase tracking-widest">fully operational</strong>. All inbound intelligence vectors are being processed through the real-time agent pipeline transparently. Wait times are strictly localized to individual agent generation bottlenecks.
        </p>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────

const App: React.FC = () => {
  const [currentPage, setCurrentPage]       = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedAgent, setSelectedAgent]     = useState<Agent | null>(null);
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

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentPage('agent-profile');
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
        return <AgentDirectoryPage agents={agents} onSelectAgent={handleSelectAgent} />;
      case 'agent-profile':
        return selectedAgent ? <AgentProfileView agent={selectedAgent} articles={articles.filter(a => a.contributingAgents.includes(selectedAgent.id))} /> : <AgentDirectoryPage agents={agents} onSelectAgent={handleSelectAgent} />;
      case 'connect':
        return <ConnectAgentPage onRefresh={loadData} />;
      case 'docs':
        return <DocsPage />;
      case 'status':
        return <StatusPage stats={liveStats} />;
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
              <button onClick={() => handleNavigate('docs')} className="btn-primary ml-2 text-xs tracking-wider uppercase bg-slate-800 hover:bg-slate-700 flex-shrink-0">
                Network API
              </button>
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
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

const AppWithPrivy: React.FC = () => {
  if (!PRIVY_ENABLED) {
    // Render without Privy if no valid App ID is configured
    return <App />;
  }
  return (
    <PrivyErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ['twitter'],
          appearance: {
            theme: 'dark',
            accentColor: '#3b82f6',
            logo: 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/globe.svg',
          },
        }}
      >
        <App />
      </PrivyProvider>
    </PrivyErrorBoundary>
  );
};

export default AppWithPrivy;
