import type { CreateTextDecision, ResolveTextDecision, TextDecision } from './types.js'
import { normalizeCandidates } from './selection.js'

/** API adapter. Authentication remains with the host application. */
export class HumanPickerClient {
  readonly baseUrl: string
  private readonly token: string
  private readonly request: typeof fetch

  constructor(options: { baseUrl?: string; token: string; fetchImpl?: typeof fetch }) {
    if (!options.token.trim()) throw new Error('A bearer token is required')
    this.token = options.token.trim()
    this.baseUrl = (options.baseUrl ?? 'http://127.0.0.1:4173').replace(/\/$/, '')
    this.request = options.fetchImpl ?? fetch
  }

  private async json<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
    const response = await this.request(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
    if (!response.ok) {
      let message = `Human Picker API error (${response.status})`
      try {
        const detail = await response.json() as { message?: string; error?: string }
        message = detail.message ?? detail.error ?? message
      } catch { /* Preserve the HTTP status fallback. */ }
      throw new Error(message)
    }
    return await response.json() as T
  }

  create(input: CreateTextDecision): Promise<TextDecision> {
    normalizeCandidates(input.options)
    return this.json('/api/v1/decisions', 'POST', input)
  }

  get(id: string): Promise<TextDecision> {
    return this.json(`/api/v1/decisions/${encodeURIComponent(id)}`)
  }

  list(): Promise<{ items: TextDecision[] }> {
    return this.json('/api/v1/decisions')
  }

  wait(id: string, timeoutMs = 15000): Promise<TextDecision> {
    const bounded = Math.max(1000, Math.min(25000, Math.trunc(timeoutMs)))
    return this.json(`/api/v1/decisions/${encodeURIComponent(id)}/wait?timeout_ms=${bounded}`)
  }

  confirm(id: string, result: ResolveTextDecision): Promise<TextDecision> {
    return this.json(`/api/v1/decisions/${encodeURIComponent(id)}/resolve`, 'POST', result)
  }

  cancel(id: string): Promise<TextDecision> {
    return this.json(`/api/v1/decisions/${encodeURIComponent(id)}/cancel`, 'POST', {})
  }
}
