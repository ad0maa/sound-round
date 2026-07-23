import { ArrowLeft, BarChart3, Crown, Trophy } from 'lucide-react'
import type {
  FindLeagueLeaderboardQuery,
  FindLeagueLeaderboardQueryVariables,
} from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

import { useAuth } from 'src/auth'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'

export const QUERY: TypedDocumentNode<
  FindLeagueLeaderboardQuery,
  FindLeagueLeaderboardQueryVariables
> = gql`
  query FindLeagueLeaderboardQuery($leagueId: String!) {
    league(id: $leagueId) {
      id
      name
      isFinished
    }
    leagueLeaderboard(leagueId: $leagueId) {
      totalPoints
      submissionCount
      roundsWon
      user {
        id
        displayName
      }
    }
  }
`

export const Loading = () => (
  <p className="text-muted-foreground">Loading leaderboard…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="text-destructive">Error: {error?.message}</p>
)

export const Empty = () => (
  <Card className="py-8 text-center">
    <p className="text-muted-foreground">
      No results yet — the leaderboard fills in once a round is complete.
    </p>
  </Card>
)

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const Success = ({
  league,
  leagueLeaderboard,
}: {
  league: FindLeagueLeaderboardQuery['league']
  leagueLeaderboard: FindLeagueLeaderboardQuery['leagueLeaderboard']
}) => {
  const { currentUser } = useAuth()

  // Winner(s): leading entries sharing the top score (co-champions on a tie).
  const topPoints = leagueLeaderboard[0]?.totalPoints
  const winners = league.isFinished
    ? leagueLeaderboard.filter((e) => e.totalPoints === topPoints)
    : []

  return (
    <>
      <Button asChild variant="ghost" className="mb-3.5 -ml-1">
        <Link to={routes.league({ id: league.id })}>
          <ArrowLeft className="h-4 w-4" />
          Back to league
        </Link>
      </Button>

      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div>
          <h1 className="mb-1 text-[38px]">Leaderboard</h1>
          <p className="text-muted-foreground">
            {league.name} · cumulative points across every round.
          </p>
        </div>
        <Button asChild variant="secondary" className="ml-auto">
          <Link to={routes.leagueStats({ id: league.id })}>
            <BarChart3 className="h-4 w-4" />
            Stats
          </Link>
        </Button>
      </div>

      {winners.length > 0 && (
        <Card className="mb-5 items-center gap-2 border border-brand2 bg-brand2-100 py-8 text-center dark:bg-brand2-900">
          <Crown className="h-10 w-10 text-brand2-700" />
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {winners.length > 1 ? 'Co-champions' : 'Champion'}
          </p>
          <p className="text-2xl font-bold">
            {winners.map((w) => w.user.displayName).join(' & ')}
          </p>
          <p className="text-muted-foreground">
            {topPoints} points across the season
          </p>
        </Card>
      )}

      <Card className="gap-2.5">
        {leagueLeaderboard.map((entry, index) => {
          const position = index + 1
          const isCurrentUser = entry.user.id === currentUser?.id
          const topThree = position <= 3

          return (
            <div
              key={entry.user.id}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl px-2 py-1.5',
                isCurrentUser && 'bg-brand-100 dark:bg-brand-900'
              )}
            >
              <span
                className={cn(
                  'grid size-8 flex-none place-items-center rounded-full text-sm font-bold',
                  topThree
                    ? 'bg-brand-600 text-white'
                    : 'bg-sand-200 text-sand-700 dark:bg-sand-800 dark:text-sand-300'
                )}
              >
                {position}
              </span>
              <Avatar className="size-9">
                <AvatarFallback className="text-[13px]">
                  {initialsOf(entry.user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {entry.user.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.submissionCount} submission
                  {entry.submissionCount === 1 ? '' : 's'}
                  {entry.roundsWon > 0 && (
                    <>
                      <span className="mx-1">·</span>
                      {entry.roundsWon}{' '}
                      <Trophy className="mb-0.5 inline h-3 w-3" /> won
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="font-heading text-xl leading-none">
                  {entry.totalPoints}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  points
                </div>
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}
