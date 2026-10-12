import type { TextCandidate, TextDecision, ResolveTextDecision } from './types.js'

/** Pure validation, independent from Vue and from the human-picker-server process. */
export function normalizeCandidates(options: TextCandidate[]): TextCandidate[] {
  if (options.length < 2 || options.length > 9) {
    throw new RangeError('txt-picker requires between 2 and 9 candidates')
  }
  const ids = new Set<string>()
  for (const option of options) {
    if (!option.id.trim() || option.id.length > 64 || ids.has(option.id)) {
      throw new Error('Candidate ids must be unique and contain 1–64 characters')
    }
    if (!option.text.trim() || option.text.length > 4000) {
      throw new Error('Candidate text must contain 1–4000 characters')
    }
    ids.add(option.id)
  }
  return options
}

export function resolvePayload(
  decision: Pick<TextDecision, 'status' | 'options'>,
  optionId: string,
  editedText?: string
): ResolveTextDecision {
  if (decision.status !== 'pending') throw new Error('Decision is not pending')
  const option = decision.options.find(candidate => candidate.id === optionId)
  if (!option) throw new Error('Unknown candidate')
  const text = editedText === undefined ? option.text : editedText.trim()
  if (!text || text.length > 4000) throw new Error('Selection must contain 1–4000 characters')
  return text === option.text ? { option_id: option.id } : { option_id: option.id, text }
}
