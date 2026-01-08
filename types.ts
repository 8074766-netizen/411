
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  ROLEPLAY = 'ROLEPLAY',
  FEEDBACK = 'FEEDBACK'
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  company: string;
  personality: string;
  avatar: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  objections: string[];
  // New Business Details
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SessionFeedback {
  score: number;
  rebuttalScore: number;
  scriptAdherenceScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  detailedAnalysis: string;
}

export interface RoleplayResult {
  persona: Persona;
  transcript: string[];
  feedback: SessionFeedback | null;
  date: Date;
}
