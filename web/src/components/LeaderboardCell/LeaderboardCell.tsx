import { Crown, Trophy } from 'lucide-react'
import type {
  FindLeagueLeaderboardQuery,
  FindLeagueLeaderboardQueryVariables,
} from 'types/graphql'

import type { TypedDocumentNode } from '@cedarjs/web'

import { useAuth } from 'src/auth'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'

export const QUERY: TypedDocumentNode<
  FindLeagueLeaderboardQuery,
  FindLeagueLeaderboardQueryVariables
> = gql`
  query FindLeagueLeaderboardQuery($leagueId: String!) {
    league(id: $leagueId) {
      id
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
  <p className="p-6 text-muted-foreground">Loading leaderboard…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

export const Empty = () => (
  <div className="p-6">
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground">
          No results yet — the leaderboard fills in once a round is complete.
        </p>
      </CardContent>
    </Card>
  </div>
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
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      {winners.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Crown className="h-10 w-10 text-amber-400" />
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {winners.length > 1 ? 'Co-champions' : 'Champion'}
            </p>
            <p className="text-2xl font-bold">
              {winners.map((w) => w.user.displayName).join(' & ')}
            </p>
            <p className="text-muted-foreground">
              {topPoints} points across the season
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Standings</CardTitle>
          <CardDescription>
            Cumulative points across every completed round.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leagueLeaderboard.map((entry, index) => {
              const position = index + 1
              const isCurrentUser = entry.user.id === currentUser?.id
              const topThree = position <= 3

              return (
                <div
                  key={entry.user.id}
                  className={`flex items-center gap-3 rounded-lg p-2 ${
                    isCurrentUser
                      ? 'border border-primary/20 bg-primary/10'
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      topThree
                        ? 'bg-gradient-to-r from-purple-500 to-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {position}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={
                        topThree ? 'bg-primary text-primary-foreground' : ''
                      }
                    >
                      {initialsOf(entry.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium">
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
                    <p className="text-sm font-medium">
                      {entry.totalPoints} pts
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
