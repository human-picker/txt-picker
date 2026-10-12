/** Transport-compatible subset of human-picker-server V0.1's decision schema. */
export type DecisionStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'

export interface TextCandidate {
  id: string
  text: string
}

export interface TextSelection {
  option_id: string
  text: string
  edited: boolean
}

export interface TextDecision {
  id: string
  type: 'text'
  title: string
  source: string
  context: { project?: string; summary?: string }
  options: TextCandidate[]
  status: DecisionStatus
  selection: TextSelection | null
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CreateTextDecision {
  type: 'text'
  title: string
  source?: string
  context?: { project?: string; summary?: string }
  options: TextCandidate[]
  expires_in_seconds?: number
}

/** Exactly the shape accepted by POST /api/v1/decisions/:id/resolve. */
export interface ResolveTextDecision {
  option_id: string
  text?: string
}
