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
}

export interface ArticleContent {
  title: string;
  tldr: string;
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
