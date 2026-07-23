import sgMail from '@sendgrid/mail'

import { logger } from './logger'

const apiKey = process.env.SENDGRID_API_KEY
if (apiKey) {
  sgMail.setApiKey(apiKey)
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@soundround.app'
const APP_URL = process.env.APP_URL || 'http://localhost:8920'

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
) => {
  const resetUrl = `${APP_URL}/reset-password?resetToken=${resetToken}`

  if (!apiKey) {
    // Lets the forgot-password flow keep working (and stay testable) before
    // SENDGRID_API_KEY is configured, instead of failing the request.
    logger.warn(
      { to, resetUrl },
      'SENDGRID_API_KEY not set — skipping password reset email'
    )
    return
  }

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Reset your SoundRound password',
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Someone requested a password reset for your SoundRound account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  })
}
