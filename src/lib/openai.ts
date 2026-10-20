/**
 * Server-only OpenAI client for the Responses API, using native fetch.
 *
 * Roles (per the provider migration decision, October 2026):
 * - 'primary': gpt-6.1-sol, reasoning effort 'low' — paid plan generation,
 *   diary review, diary plan update, admin social primary.
 * - 'light': gpt-6-luna, reasoning effort 'none' — free schedule generation,
 *   extraction, YES/NO topic check, admin social fallback and repair.
 *
 * Sol does not support the 'none' or 'minimal' efforts; keep 'low'.
 * Optional server-only model overrides: OPENAI_PRIMARY_MODEL / OPENAI_LIGHT_MODEL.
 */

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'

export const OPENAI_MODEL_IDS = {
  primary: 'gpt-6.1-sol',
  light: 'gpt-6-luna',
} as const

export type OpenAIRole = keyof typeof OPENAI_MODEL_IDS

const ROLE_EFFORT: Record<OpenAIRole, 'low' | 'none'> = {
  primary: 'low',
  light: 'none',
}

function getModelId(role: OpenAIRole): string {
  const override = role === 'primary'
    ? process.env.OPENAI_PRIMARY_MODEL
    : process.env.OPENAI_LIGHT_MODEL
  return override || OPENAI_MODEL_IDS[role]
}

export interface OpenAICallOptions {
  role: OpenAIRole
  prompt: string
  /** Request deadline. The underlying request is aborted when it elapses. */
  timeoutMs: number
  /** Upper bound on output tokens, including any reasoning tokens. */
  maxOutputTokens: number
}

export interface OpenAIUsageCounts {
  inputTokens: number | null
  outputTokens: number | null
  reasoningTokens: number | null
  cachedTokens: number | null
  totalTokens: number | null
}

/** Provider-neutral result. Do not recreate Gemini's response shape on top of this. */
export interface OpenAIResult {
  text: string
  model: string
  status: string
  usage: OpenAIUsageCounts
}

export class OpenAIError extends Error {
  /** HTTP status when the server responded. */
  readonly status?: number
  /** Recognized upstream error code; arbitrary response text is never retained. */
  readonly code?: string
  /** True only for errors worth retrying: timeouts, network faults, retryable rate limits, server failures. */
  readonly retryable: boolean

  constructor(message: string, options: { status?: number; code?: string; retryable?: boolean } = {}) {
    super(message)
    this.name = 'OpenAIError'
    this.status = options.status
    this.code = options.code
    this.retryable = options.retryable ?? false
  }
}

export function isOpenAIRetryableError(error: unknown): boolean {
  if (error instanceof OpenAIError) return error.retryable
  // Belt-and-braces for generic network/timeout failures thrown outside the helper.
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('timeout') || message.includes('timed out') || message.includes('network')
  }
  return false
}

// 429 is normally retryable, but exhausted billing quota is a permanent condition.
const RETRYABLE_HTTP_STATUSES = [408, 429, 500, 502, 503, 504]
const NON_RETRYABLE_ERROR_CODES = ['insufficient_quota']
const SAFE_ERROR_CODES = new Set([
  'insufficient_quota', 'rate_limit_exceeded', 'invalid_api_key',
  'model_not_found', 'invalid_request_error', 'server_error',
  'context_length_exceeded', 'billing_hard_limit_reached', 'billing_not_active',
])
const SAFE_RESPONSE_STATUSES = new Set(['incomplete', 'failed', 'cancelled', 'queued', 'in_progress'])
const SAFE_INCOMPLETE_REASONS = new Set(['max_output_tokens', 'content_filter'])

function isRetryableHttpStatus(status: number, code?: string) {
  if (code && NON_RETRYABLE_ERROR_CODES.some((c) => code.toLowerCase().includes(c))) {
    return false
  }
  return RETRYABLE_HTTP_STATUSES.includes(status)
}

interface ResponsesApiPayload {
  model?: string
  status?: string
  incomplete_details?: { reason?: string }
  output?: Array<{
    type?: string
    role?: string
    content?: Array<{
      type?: string
      text?: string
      refusal?: string
    }>
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
    output_tokens_details?: { reasoning_tokens?: number }
    input_tokens_details?: { cached_tokens?: number }
  }
}

interface ResponsesApiErrorBody {
  error?: { message?: string; type?: string; code?: string }
}

// The SDK convenience property `output_text` does not exist on REST JSON, and
// `output[0]` is not guaranteed to be a text message (reasoning items come
// first). Walk every message item and concatenate its output_text blocks.
function extractTextFromPayload(payload: ResponsesApiPayload): string {
  const parts: string[] = []
  for (const item of payload.output ?? []) {
    if (item.type !== 'message') continue
    for (const block of item.content ?? []) {
      if (block.type === 'output_text' && typeof block.text === 'string') {
        parts.push(block.text)
      }
    }
  }
  return parts.join('')
}

function hasRefusal(payload: ResponsesApiPayload): boolean {
  for (const item of payload.output ?? []) {
    if (item.type !== 'message') continue
    for (const block of item.content ?? []) {
      if (block.type === 'refusal') {
        return true
      }
    }
  }
  return false
}

function extractUsage(payload: ResponsesApiPayload): OpenAIUsageCounts {
  const usage = payload.usage ?? {}
  return {
    inputTokens: usage.input_tokens ?? null,
    outputTokens: usage.output_tokens ?? null,
    reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? null,
    cachedTokens: usage.input_tokens_details?.cached_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
  }
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as ResponsesApiErrorBody
    const code = body?.error?.code
    return typeof code === 'string' && SAFE_ERROR_CODES.has(code) ? code : undefined
  } catch (error) {
    // A gateway can return a non-JSON error. Body-read failures and aborts must
    // still reach the request boundary so they retain their retry behavior.
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

export async function callOpenAI(options: OpenAICallOptions): Promise<OpenAIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new OpenAIError('Missing OPENAI_API_KEY environment variable')
  }

  const model = getModelId(options.role)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: options.prompt,
        reasoning: { effort: ROLE_EFFORT[options.role] },
        max_output_tokens: options.maxOutputTokens,
        store: false,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const code = await readErrorCode(response)
      throw new OpenAIError(`OpenAI request failed with HTTP ${response.status}`, {
        status: response.status,
        code,
        retryable: isRetryableHttpStatus(response.status, code),
      })
    }

    let payload: ResponsesApiPayload
    try {
      payload = (await response.json()) as ResponsesApiPayload
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new OpenAIError('OpenAI returned a non-JSON response body')
      }
      throw error
    }

    const status = payload.status === 'completed'
      ? 'completed'
      : SAFE_RESPONSE_STATUSES.has(payload.status ?? '') ? payload.status! : 'unknown'
    if (status !== 'completed') {
      const reason = payload.incomplete_details?.reason
      const detail = reason && SAFE_INCOMPLETE_REASONS.has(reason) ? ` (reason: ${reason})` : ''
      throw new OpenAIError(`OpenAI response status was "${status}"${detail}`, { status: response.status })
    }

    if (hasRefusal(payload)) {
      throw new OpenAIError('OpenAI refused to respond', { status: response.status })
    }

    const text = extractTextFromPayload(payload)
    if (!text.trim()) {
      throw new OpenAIError('OpenAI returned an empty response text', { status: response.status })
    }

    const usage = extractUsage(payload)
    // Privacy-safe operational logging: model and token counts only — never
    // prompts, response text, baby information, or diary content.
    console.log('[openai] response', { model, status, usage })

    return { text, model, status, usage }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new OpenAIError(`OpenAI request timed out after ${options.timeoutMs}ms`, { retryable: true })
    }
    if (error instanceof OpenAIError) throw error
    // Transport messages can include request details; retain no raw text/cause.
    throw new OpenAIError('OpenAI request failed', { retryable: true })
  } finally {
    // fetch resolves at headers. Keep the deadline through body consumption.
    clearTimeout(timeoutId)
  }
}
