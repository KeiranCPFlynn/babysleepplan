import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export const FROM_EMAIL = 'Baby Sleep Plan <noreply@babysleepplan.com>'
