import { Trophy } from 'lucide-react'
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
  leagueLeaderboard,
}: {
  leagueLeaderboard: FindLeagueLeaderboardQuery['leagueLeaderboard']
}) => {
  const { currentUser } = useAuth()

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
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
