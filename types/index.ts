export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  sources?: { title: string; url: string; snippet: string }[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  slug?: string;
  messages: Message[];
  model: string;
  shared: boolean;
  pinned: boolean;
}
