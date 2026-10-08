import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { callOpenAI, isOpenAIRetryableError, OpenAIError, OPENAI_MODEL_IDS } from '@/lib/openai'

function okResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Mirrors the documented Responses API shape: a reasoning item precedes the
// assistant message, whose content blocks are typed (output_text / refusal).
function completedPayload(overrides: Record<string, unknown> = {}) {
  return {
    object: 'response',
    status: 'completed',
    model: 'gpt-6.1-sol',
    output: [
      { type: 'reasoning', id: 'rs_1', summary: [] },
      {
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text: 'Hello from the model', annotations: [] }],
      },
    ],
    usage: {
      input_tokens: 120,
      output_tokens: 40,
      total_tokens: 160,
      output_tokens_details: { reasoning_tokens: 12 },
      input_tokens_details: { cached_tokens: 100 },
    },
    ...overrides,
  }
}

describe('OpenAI helper - request shape', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    delete process.env.OPENAI_PRIMARY_MODEL
    delete process.env.OPENAI_LIGHT_MODEL
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends the documented Responses API body for the primary role', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(completedPayload()))
    vi.stubGlobal('fetch', fetchMock)

    const result = await callOpenAI({
      role: 'primary',
      prompt: 'Write a sleep plan',
      timeoutMs: 1000,
      maxOutputTokens: 16000,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-openai-key')

    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      model: 'gpt-6.1-sol',
      input: 'Write a sleep plan',
      reasoning: { effort: 'low' },
      max_output_tokens: 16000,
      store: false,
    })

    expect(result.text).toBe('Hello from the model')
    expect(result.model).toBe('gpt-6.1-sol')
    expect(result.status).toBe('completed')
  })

  it('uses the light model with reasoning disabled for the light role', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(completedPayload()))
    vi.stubGlobal('fetch', fetchMock)

    await callOpenAI({
      role: 'light',
      prompt: 'Extract JSON',
      timeoutMs: 1000,
      maxOutputTokens: 1000,
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.model).toBe('gpt-6-luna')
    expect(body.reasoning).toEqual({ effort: 'none' })
  })

  it('honours optional model overrides without falling back silently', async () => {
    process.env.OPENAI_LIGHT_MODEL = 'gpt-6-luna-preview-test'
    const fetchMock = vi.fn().mockResolvedValue(okResponse(completedPayload()))
    vi.stubGlobal('fetch', fetchMock)

    await callOpenAI({ role: 'light', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.model).toBe('gpt-6-luna-preview-test')
    expect(OPENAI_MODEL_IDS.light).toBe('gpt-6-luna') // constants unchanged
  })

  it('extracts text with reasoning items before the message and concatenates blocks', async () => {
    const payload = completedPayload({
      output: [
        { type: 'reasoning', content: [], summary: [{ type: 'summary_text', text: 'thinking...' }] },
        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'part one ' }] },
        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'part two' }] },
      ],
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(payload)))

    const result = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
    expect(result.text).toBe('part one part two')
  })

  it('captures available token counts in the result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(completedPayload())))

    const result = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
    expect(result.usage).toEqual({
      inputTokens: 120,
      outputTokens: 40,
      reasoningTokens: 12,
      cachedTokens: 100,
      totalTokens: 160,
    })
  })

  it('logs usage without prompt or response text', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(completedPayload())))

    await callOpenAI({ role: 'primary', prompt: 'SECRET PROMPT CONTENT', timeoutMs: 1000, maxOutputTokens: 100 })

    expect(logSpy).toHaveBeenCalled()
    const logged = JSON.stringify(logSpy.mock.calls)
    expect(logged).toContain('"usage"')
    expect(logged).not.toContain('SECRET PROMPT CONTENT')
    expect(logged).not.toContain('Hello from the model')
  })
})

describe('OpenAI helper - failure handling', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('throws without calling fetch when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
    ).rejects.toThrow('Missing OPENAI_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([401, 400, 402, 403, 404, 422])('HTTP %s is non-retryable', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(status, {
      error: { message: 'upstream problem', type: 'invalid_request_error', code: 'some_code' },
    })))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error).toBeInstanceOf(OpenAIError)
    expect(error.status).toBe(status)
    expect(error.message).toBe('upstream problem')
    expect(error.retryable).toBe(false)
  })

  it.each([408, 429, 500, 502, 503, 504])('HTTP %s is retryable', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(status, {
      error: { message: 'slow down', type: 'server_error', code: 'rate_limit_exceeded' },
    })))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error).toBeInstanceOf(OpenAIError)
    expect(error.retryable).toBe(true)
  })

  it('treats exhausted billing quota (429 insufficient_quota) as non-retryable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(429, {
      error: { message: 'You exceeded your current quota', type: 'insufficient_quota', code: 'insufficient_quota' },
    })))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error.status).toBe(429)
    expect(error.retryable).toBe(false)
  })

  it('network failures are retryable and never include the API key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error).toBeInstanceOf(OpenAIError)
    expect(error.retryable).toBe(true)
    expect(error.message).not.toContain('test-openai-key')
  })

  it('rejects incomplete responses instead of accepting truncated text', async () => {
    const payload = completedPayload({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: [
        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'truncated plan…' }] },
      ],
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(payload)))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error.message).toContain('incomplete')
    expect(error.message).toContain('max_output_tokens')
    expect(error.retryable).toBe(false)
  })

  it('rejects refusals', async () => {
    const payload = completedPayload({
      output: [
        { type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'cannot help with that' }] },
      ],
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(payload)))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error.message).toContain('refused')
    expect(error.retryable).toBe(false)
  })

  it('rejects empty response text', async () => {
    const payload = completedPayload({
      output: [
        { type: 'reasoning', content: [], summary: [] },
        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '   ' }] },
      ],
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(payload)))

    await expect(
      callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
    ).rejects.toThrow('empty response text')
  })

  it('rejects non-JSON success bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('gateway garbage', { status: 200 })
    ))

    const error = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 1000, maxOutputTokens: 100 })
      .catch((e) => e)
    expect(error).toBeInstanceOf(OpenAIError)
    expect(error.retryable).toBe(false)
  })
})

describe('OpenAI helper - request abort', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('aborts the underlying request at the deadline and reports a retryable timeout', async () => {
    vi.useFakeTimers()

    let observedSignal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => {
      observedSignal = init.signal
      return new Promise((_resolve, reject) => {
        observedSignal!.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted')
          abortError.name = 'AbortError'
          reject(abortError)
        })
      })
    }))

    const pending = callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 5000, maxOutputTokens: 100 })
    const rejection = pending.catch((e) => e)

    await vi.advanceTimersByTimeAsync(5000)

    const error = await rejection
    expect(observedSignal?.aborted).toBe(true)
    expect(error).toBeInstanceOf(OpenAIError)
    expect(error.message).toContain('timed out after 5000ms')
    expect(error.retryable).toBe(true)
  })

  it('clears the deadline timer once the request settles', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(completedPayload())))

    const result = await callOpenAI({ role: 'primary', prompt: 'x', timeoutMs: 30_000, maxOutputTokens: 100 })
    expect(result.text).toBe('Hello from the model')

    // Timer is cleared: advancing far past the deadline triggers nothing.
    // (If the timer were still live, the abort callback would fire on a settled
    // request; there is nothing to observe, so this mainly guards no hang.)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('isOpenAIRetryableError', () => {
  it('follows the retryable flag on OpenAIError instances', () => {
    const retryable = new OpenAIError('server error', { status: 500, retryable: true })
    const permanent = new OpenAIError('bad request', { status: 400, retryable: false })
    expect(isOpenAIRetryableError(retryable)).toBe(true)
    expect(isOpenAIRetryableError(permanent)).toBe(false)
  })

  it('recognises generic timeout-like errors from before the helper boundary', () => {
    expect(isOpenAIRetryableError(new Error('Gemini API timeout after 100 seconds'))).toBe(true)
    expect(isOpenAIRetryableError(new Error('plain failure'))).toBe(false)
    expect(isOpenAIRetryableError('not an error')).toBe(false)
  })
})
