import { getResend, FROM_EMAIL } from './resend'
import { escapeHtml, sanitizeEmailSubject } from '@/lib/sanitize'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions) {
  const resend = getResend()

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      ...(replyTo && { replyTo }),
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const safeName = escapeHtml(name || 'there')
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to LunaCradle</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7E57C2;">Welcome to LunaCradle</h1>
        </div>

        <p>Hi ${safeName},</p>

        <p>Thank you for signing up for LunaCradle! We're here to help you and your baby get better sleep.</p>

        <p>Here's what you can do next:</p>
        <ol>
          <li><strong>Add your baby's information</strong> - This helps us personalize your experience</li>
          <li><strong>Complete the sleep questionnaire</strong> - Tell us about your baby's sleep patterns</li>
          <li><strong>Get your personalized plan</strong> - Our AI will create a custom sleep plan just for you</li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="background-color: #7E57C2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>

        <p>If you have any questions, feel free to reply to this email.</p>

        <p>Sweet dreams,<br>The LunaCradle Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you signed up for LunaCradle.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: sanitizeEmailSubject('Welcome to LunaCradle! 🌙'),
    html,
    text: `Welcome to LunaCradle!\n\nHi ${name || 'there'},\n\nThank you for signing up! Visit your dashboard to get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

export async function sendPlanReadyEmail(
  email: string,
  babyName: string,
  planId: string
) {
  const safeBabyName = escapeHtml(babyName)
  const planUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans/${planId}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Sleep Plan is Ready!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7E57C2;">${safeBabyName}'s Sleep Plan is Ready!</h1>
        </div>

        <p>Great news! Your personalized sleep plan for ${safeBabyName} has been generated and is ready to view.</p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">What's in your plan:</h3>
          <ul style="color: #166534;">
            <li>Personalized sleep schedule based on ${safeBabyName}'s age</li>
            <li>Step-by-step bedtime routine</li>
            <li>Sleep training approach tailored to your comfort level</li>
            <li>Solutions for your specific challenges</li>
            <li>Week-by-week implementation guide</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${planUrl}"
             style="background-color: #7E57C2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Sleep Plan
          </a>
        </div>

        <p><strong>Tips for success:</strong></p>
        <ul>
          <li>Read through the entire plan before starting</li>
          <li>Choose a good time to begin (avoid travel or illness)</li>
          <li>Stay consistent - this is key!</li>
          <li>Be patient - changes take time</li>
        </ul>

        <p>We're rooting for you and ${safeBabyName}!</p>

        <p>Sweet dreams,<br>The LunaCradle Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you purchased a sleep plan from LunaCradle.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: sanitizeEmailSubject(`${babyName}'s Sleep Plan is Ready! 🎉`),
    html,
    text: `Your sleep plan for ${babyName} is ready!\n\nView it here: ${planUrl}`,
  })
}

export async function sendPaymentConfirmationEmail(
  email: string,
  babyName: string,
  amount: string
) {
  const safeBabyName = escapeHtml(babyName)
  const safeAmount = escapeHtml(amount)
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7E57C2;">Payment Confirmed</h1>
        </div>

        <p>Thank you for your purchase!</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Item:</strong> Personalized Sleep Plan for ${safeBabyName}</p>
          <p><strong>Amount:</strong> ${safeAmount}</p>
          <p style="margin-bottom: 0;"><strong>Status:</strong> <span style="color: #16a34a;">Paid</span></p>
        </div>

        <p>Your personalized sleep plan is now being generated. You'll receive another email when it's ready (usually within a few minutes).</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans"
             style="background-color: #7E57C2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Plans
          </a>
        </div>

        <p>Thank you for choosing LunaCradle!</p>

        <p>Best regards,<br>The LunaCradle Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This is a receipt for your purchase. If you have any questions, please reply to this email.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Payment Confirmed - LunaCradle',
    html,
    text: `Payment confirmed!\n\nThank you for purchasing a sleep plan for ${babyName}.\nAmount: ${amount}\n\nYour plan is being generated and will be ready soon.\n\nVisit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans`,
  })
}

export async function sendContactNotificationEmail(
  name: string,
  email: string,
  topic: string,
  message: string
) {
  const notificationEmail = process.env.CONTACT_NOTIFICATION_EMAIL
  if (!notificationEmail) return

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeTopic = escapeHtml(topic)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Message</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7E57C2;">New Contact Message</h1>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Topic:</strong> ${safeTopic}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #7E57C2;">Message:</h3>
          <p>${safeMessage}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This message was submitted via the LunaCradle contact form. Reply directly to respond to the sender.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: notificationEmail,
    subject: sanitizeEmailSubject(`[LunaCradle] Contact: ${topic}`),
    html,
    text: `New contact form message\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`,
    replyTo: email,
  })
}
