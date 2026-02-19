export interface ExtractedFields {
  age_months: number | null
  wake_time: string | null // "HH:MM" 24h format
  bedtime: string | null // "HH:MM" 24h format
  naps_count: number | null
  nap_lengths: string | null // e.g. "30-45 min"
  main_issue: string | null
  confidence_score: number // 0.0–1.0
  assumptions: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type SessionPhase = 'chat' | 'preview' | 'email_sent'
