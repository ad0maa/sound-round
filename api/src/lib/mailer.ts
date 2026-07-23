import { Resend } from 'resend'

import { logger } from './logger'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

// resend.dev is Resend's built-in sandbox sender — works with no domain
// setup, so this is a safe default before a real domain is verified.
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'onboarding@resend.dev'
const APP_URL = process.env.APP_URL || 'http://localhost:8920'

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
) => {
  const resetUrl = `${APP_URL}/reset-password?resetToken=${resetToken}`

  if (!resend) {
    // Lets the forgot-password flow keep working (and stay testable) before
    // RESEND_API_KEY is configured, instead of failing the request.
    logger.warn(
      { to, resetUrl },
      'RESEND_API_KEY not set — skipping password reset email'
    )
    return
  }

  const { error } = await resend.emails.send({
    to,
    from: FROM_EMAIL,
    subject: 'Reset your SoundRound password',
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Someone requested a password reset for your SoundRound account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  })

  // The Resend SDK returns { error } instead of throwing — surface it, or
  // the caller (and the user) would see this as a silent success.
  if (error) {
    logger.error({ to, error }, 'Failed to send password reset email')
    throw new Error('Could not send the password reset email')
  }
}
