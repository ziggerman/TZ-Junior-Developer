export type TicketPriority = "низький" | "середній" | "високий";

export type TicketCategory = "оплата" | "доставка" | "скарга" | "технічне" | "інше" | string;

export interface TicketAnalysis {
  priority: TicketPriority;
  category: TicketCategory;
  summary: string;
  draftResponse: string;
}

export interface Ticket {
  id: string;
  clientName: string;
  content: string;
  status: "pending" | "analyzed" | string;
  priority?: TicketPriority | null;
  category?: TicketCategory | null;
  summary?: string | null;
  draftResponse?: string | null;
  analyzedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type LLMProvider = "openai" | "anthropic" | "gemini" | "groq";

export interface LLMConfig {
  provider?: LLMProvider;
  apiKey?: string;
  model?: string;
}
