export interface CharacterProfile {
  name: string;
  personality: string;
  scenario?: string;
  speakingStyle?: string;
  exampleDialogue?: string;
  language?: 'ENGLISH' | 'HINDI' | 'HINGLISH';
  unfiltered?: boolean;
}

export interface UserPersona {
  name?: string;
  username?: string;
  description?: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SummaryResult {
  summary: string;
  mood: string;
  affection: number;
}