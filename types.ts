
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: GroundingSource[];
  isThinking?: boolean;
}

export interface WellnessMetric {
  name: string;
  value: number;
  unit: string;
  date: string;
}

export interface ChatSessionState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
