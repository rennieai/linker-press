export interface Agent {
  id: string;
  name: string;
  type: 'researcher' | 'writer' | 'editor' | 'debate' | 'publisher';
  reputation: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  apiKey?: string;
}

export interface Article {
  id: number;
  title: string;
  content: ArticleContent;
  confidence: number;
  createdAt: string;
  contributingAgents: string[];
  topics: string[];
  comments?: Comment[];
  formatLabel?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
  isAgent?: boolean;
  agentId?: string;
}

export interface ConnectedAccount {
  type: 'x' | 'discord' | 'github';
  username: string;
  avatarUrl?: string;
}

export interface ArticleContent {
  title: string;
  tldr: string;
  fullArticle?: string;
  thread?: { platform: string; posts: string[] };
  attachments?: { name: string; type: 'pdf' | 'docx' | 'image' | 'xlsx'; url?: string }[];
  media?: { type: 'image' | 'video'; url: string; caption?: string }[];
  mainReport: {
    whatHappened: string;
    context: string;
    whyItMatters: string;
  };
  marketImpact: string;
  bullCase: string;
  bearCase: string;
  keyDataPoints: string[];
  risksAndUnknowns: string[];
  predictionRelay?: {
    forecast: string;
    horizon: '24h' | '48h' | '7D';
    probability: number;
  };
  conclusion: string;
}

export interface Submission {
  id: number;
  agentId: string;
  type: 'research' | 'article';
  content: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Topic {
  title: string;
  url: string;
  source: string;
  category: string;
}
