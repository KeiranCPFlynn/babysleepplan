import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the resend module before importing anything that uses it
vi.mock('@/lib/email/resend', () => ({
  getResend: vi.fn(),
  FROM_EMAIL: 'LunaCradle <noreply@lunacradle.com>',
}))

import {
  sendEmail,
  sendWelcomeEmail,
  sendPlanReadyEmail,
  sendPaymentConfirmationEmail,
  sendContactNotificationEmail,
} from '@/lib/email/send'
import { getResend } from '@/lib/email/resend'

const mockSend = vi.fn()
const mockGetResend = vi.mocked(getResend)

beforeEach(() => {
  vi.clearAllMocks()
  mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
  mockGetResend.mockReturnValue({ emails: { send: mockSend } } as unknown as ReturnType<typeof getResend>)
  process.env.NEXT_PUBLIC_APP_URL = 'https://lunacradle.com'
})

describe('sendEmail', () => {
  it('calls Resend API with correct params', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })

    expect(mockSend).toHaveBeenCalledWith({
      from: 'LunaCradle <noreply@lunacradle.com>',
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
      text: undefined,
    })
  })

  it('throws on Resend error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'API error' } })
    await expect(
      sendEmail({ to: 'user@example.com', subject: 'Test', html: '<p>Hi</p>' })
    ).rejects.toBeDefined()
  })

  it('includes replyTo only when provided', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      replyTo: 'reply@example.com',
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'reply@example.com' })
    )
  })

  it('does not include replyTo when not provided', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    })

    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('replyTo')
  })
})

describe('sendWelcomeEmail', () => {
  it('calls sendEmail with correct to, subject, html', async () => {
    await sendWelcomeEmail('user@example.com', 'Alice')

    expect(mockSend).toHaveBeenCalledTimes(1)
    const args = mockSend.mock.calls[0][0]
    expect(args.to).toBe('user@example.com')
    expect(args.subject).toContain('Welcome to LunaCradle')
  })

  it('HTML-escapes the user name', async () => {
    await sendWelcomeEmail('user@example.com', '<script>alert("xss")</script>')

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('&lt;script&gt;')
    expect(args.html).not.toContain('<script>')
  })

  it('falls back to "there" when name is empty', async () => {
    await sendWelcomeEmail('user@example.com', '')

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('Hi there')
  })

  it('sanitizes the subject', async () => {
    // The subject is hardcoded, but we verify it doesn't contain newlines
    await sendWelcomeEmail('user@example.com', 'Test')
    const args = mockSend.mock.calls[0][0]
    expect(args.subject).not.toMatch(/[\r\n]/)
  })
})

describe('sendPlanReadyEmail', () => {
  it('HTML-escapes baby name in HTML body', async () => {
    await sendPlanReadyEmail('user@example.com', '<b>Baby</b>', 'plan-123')

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('&lt;b&gt;Baby&lt;/b&gt;')
    expect(args.html).not.toContain('<b>Baby</b>')
  })

  it('includes plan URL in email body', async () => {
    await sendPlanReadyEmail('user@example.com', 'Luna', 'plan-456')

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('https://lunacradle.com/dashboard/plans/plan-456')
  })

  it('includes baby name in subject and sanitizes it', async () => {
    await sendPlanReadyEmail('user@example.com', 'Luna', 'plan-789')

    const args = mockSend.mock.calls[0][0]
    expect(args.subject).toContain('Luna')
    expect(args.subject).not.toMatch(/[\r\n]/)
  })
})

describe('sendPaymentConfirmationEmail', () => {
  it('HTML-escapes baby name and amount', async () => {
    await sendPaymentConfirmationEmail(
      'user@example.com',
      '<b>Baby</b>',
      '$19 & tax'
    )

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('&lt;b&gt;Baby&lt;/b&gt;')
    expect(args.html).toContain('$19 &amp; tax')
  })

  it('includes dashboard URL', async () => {
    await sendPaymentConfirmationEmail('user@example.com', 'Luna', '$19')

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('https://lunacradle.com/dashboard/plans')
  })
})

describe('sendContactNotificationEmail', () => {
  it('returns early when CONTACT_NOTIFICATION_EMAIL is not set', async () => {
    delete process.env.CONTACT_NOTIFICATION_EMAIL

    await sendContactNotificationEmail(
      'John', 'john@example.com', 'Help', 'I need help'
    )

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('HTML-escapes all user fields', async () => {
    process.env.CONTACT_NOTIFICATION_EMAIL = 'admin@lunacradle.com'

    await sendContactNotificationEmail(
      '<b>John</b>',
      'john@example.com',
      '<script>topic</script>',
      'Message with <html>'
    )

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('&lt;b&gt;John&lt;/b&gt;')
    expect(args.html).toContain('&lt;script&gt;topic&lt;/script&gt;')
    expect(args.html).toContain('Message with &lt;html&gt;')
  })

  it('converts newlines to <br> in message', async () => {
    process.env.CONTACT_NOTIFICATION_EMAIL = 'admin@lunacradle.com'

    await sendContactNotificationEmail(
      'John', 'john@example.com', 'Help', 'Line 1\nLine 2\nLine 3'
    )

    const args = mockSend.mock.calls[0][0]
    expect(args.html).toContain('Line 1<br>Line 2<br>Line 3')
  })

  it('sets replyTo to sender email', async () => {
    process.env.CONTACT_NOTIFICATION_EMAIL = 'admin@lunacradle.com'

    await sendContactNotificationEmail(
      'John', 'john@example.com', 'Help', 'Message'
    )

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'john@example.com' })
    )
  })
})
