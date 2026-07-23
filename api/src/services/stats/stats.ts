import type { QueryResolvers } from 'types/graphql'

import { db } from 'src/lib/db'
import { requireMembership } from 'src/lib/membership'
import { settleLeagueRounds } from 'src/lib/roundManager'

/**
 * League superlatives, derived entirely from votes on completed
 * (results-state) rounds — same skeleton as leagueLeaderboard in votes.ts.
 */
export const leagueStats: QueryResolvers['leagueStats'] = async ({
  leagueId,
}) => {
  await requireMembership(leagueId)
  await settleLeagueRounds(leagueId)

  const members = await db.leagueMember.findMany({
    where: { leagueId },
    include: { user: { select: { displayName: true } } },
  })
  const nameById = new Map(members.map((m) => [m.userId, m.user.displayName]))

  const completedRounds = await db.round.findMany({
    where: { leagueId, state: 'results' },
    orderBy: { roundNumber: 'asc' },
    include: {
      submissions: {
        include: { votes: { select: { voterId: true, points: true } } },
      },
    },
  })

  // Per-user list of per-submission totals, plus the pairwise given matrix.
  const scoresByUser = new Map<string, number[]>()
  const pairTotals = new Map<string, number>() // "voterId→submitterId"

  let bestSingleRound = null
  let mostControversial = null
  let bestControversy = 0

  for (const round of completedRounds) {
    for (const submission of round.submissions) {
      const submitterName = nameById.get(submission.userId)
      if (!submitterName) {
        continue // submitter has since left the league
      }

      let up = 0
      let down = 0
      for (const vote of submission.votes) {
        if (vote.points > 0) up += vote.points
        else down += -vote.points

        if (nameById.has(vote.voterId)) {
          const key = `${vote.voterId}→${submission.userId}`
          pairTotals.set(key, (pairTotals.get(key) ?? 0) + vote.points)
        }
      }
      const total = up - down

      const scores = scoresByUser.get(submission.userId) ?? []
      scores.push(total)
      scoresByUser.set(submission.userId, scores)

      if (!bestSingleRound || total > bestSingleRound.points) {
        bestSingleRound = {
          displayName: submitterName,
          roundNumber: round.roundNumber,
          theme: round.theme,
          trackName: submission.trackName,
          points: total,
        }
      }

      // Controversial = loved AND hated: rank by the smaller of the two
      // sides, tie-broken by overall heat.
      if (up > 0 && down > 0) {
        const controversy = Math.min(up, down) * 1000 + up + down
        if (controversy > bestControversy) {
          bestControversy = controversy
          mostControversial = {
            trackName: submission.trackName,
            artistName: submission.artistName,
            displayName: submitterName,
            upPoints: up,
            downPoints: down,
          }
        }
      }
    }
  }

  const averages = [...scoresByUser.entries()]
    .map(([userId, scores]) => ({
      displayName: nameById.get(userId),
      average:
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10,
      submissionCount: scores.length,
    }))
    .sort((a, b) => b.average - a.average)

  const bestAverage = averages[0] ?? null

  // Most consistent = lowest standard deviation, min 2 submissions.
  let mostConsistent = null
  let bestDeviation = Infinity
  for (const [userId, scores] of scoresByUser) {
    if (scores.length < 2) continue
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const deviation = Math.sqrt(
      scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
    )
    if (deviation < bestDeviation) {
      bestDeviation = deviation
      mostConsistent = {
        displayName: nameById.get(userId),
        average: Math.round(mean * 10) / 10,
        submissionCount: scores.length,
      }
    }
  }

  const pointsGiven = [...pairTotals.entries()]
    .map(([key, points]) => {
      const [fromId, toId] = key.split('→')
      return {
        fromName: nameById.get(fromId),
        toName: nameById.get(toId),
        points,
      }
    })
    .sort((a, b) => b.points - a.points)

  const biggestFan = pointsGiven.find((p) => p.points > 0) ?? null

  return {
    roundsCompleted: completedRounds.length,
    bestSingleRound,
    bestAverage,
    mostConsistent,
    biggestFan,
    mostControversial,
    averages,
    pointsGiven,
  }
}
