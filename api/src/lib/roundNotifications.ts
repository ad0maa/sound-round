import type { Round } from 'api/db/generated/prisma'

import { db } from './db.js'
import { logger } from './logger.js'
import { sendRoundEmail } from './mailer.js'

const APP_URL = process.env.APP_URL || 'http://localhost:8920'

export type RoundTransitionKind = 'submitting' | 'voting' | 'results'

/**
 * Emails every (non-demo) league member when a round changes phase. Called
 * only by the roundManager invocation that won the compare-and-set, so a
 * transition never notifies twice. Deadline-driven transitions settle lazily
 * on the next read, so those emails go out when someone next touches the
 * league — good enough without a cron.
 *
 * Deliberately best-effort: any failure is logged and swallowed so email
 * problems can never fail (or roll back) a round transition. Await it —
 * fire-and-forget promises die with the serverless invocation.
 */
export const notifyRoundTransition = async (
  kind: RoundTransitionKind,
  round: Round
) => {
  try {
    const [league, members] = await Promise.all([
      db.league.findUnique({ where: { id: round.leagueId } }),
      db.leagueMember.findMany({
        where: { leagueId: round.leagueId },
        include: { user: { select: { email: true, isDemo: true } } },
      }),
    ])
    if (!league) {
      return
    }

    // Demo accounts have fabricated addresses — never email them.
    const recipients = members
      .filter((m) => !m.user.isDemo)
      .map((m) => m.user.email)
    if (recipients.length === 0) {
      return
    }

    const roundPath = `${APP_URL}/leagues/${league.id}/rounds/${round.id}`
    const roundLabel = `Round ${round.roundNumber}: ${round.theme}`

    const content: Record<
      RoundTransitionKind,
      { subject: string; line: string; cta: string; url: string }
    > = {
      submitting: {
        subject: `🎵 ${league.name} — a new round is open!`,
        line: `${roundLabel} is open for submissions. Pick your song before the deadline.`,
        cta: 'Submit a song',
        url: `${roundPath}/submit`,
      },
      voting: {
        subject: `🗳️ ${league.name} — voting is open!`,
        line: `All songs are in for ${roundLabel}. Listen through and spread your points.`,
        cta: 'Vote now',
        url: `${roundPath}/vote`,
      },
      results: {
        subject: `🏆 ${league.name} — results are in!`,
        line: `The votes are counted for ${roundLabel}. See who took the round.`,
        cta: 'See the results',
        url: `${roundPath}/results`,
      },
    }

    const { subject, line, cta, url } = content[kind]

    await sendRoundEmail(
      recipients,
      subject,
      `${line}\n\n${cta}: ${url}`,
      `<p>${line}</p><p><a href="${url}">${cta}</a></p>`
    )
  } catch (error) {
    logger.error(
      { error, roundId: round.id, kind },
      'Failed to send round transition notifications'
    )
  }
}
