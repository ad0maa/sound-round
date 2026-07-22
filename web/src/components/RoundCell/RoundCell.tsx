import { useState } from 'react'

import type { FindRoundQuery, FindRoundQueryVariables } from 'types/graphql'

import { Link, navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import { Button } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import { Progress } from 'src/components/ui/progress'

export const QUERY: TypedDocumentNode<FindRoundQuery, FindRoundQueryVariables> =
  gql`
    query FindRoundQuery($id: String!) {
      round(id: $id) {
        id
        leagueId
        roundNumber
        theme
        description
        state
        songsPerPlayer
      }
      roundProgress(roundId: $id) {
        state
        totalMembers
        submittedCount
        votedCount
        members {
          userId
          displayName
          hasSubmitted
          hasVoted
        }
      }
    }
  `

const ADVANCE_ROUND = gql`
  mutation AdvanceRoundMutation($id: String!, $state: RoundState!) {
    advanceRound(id: $id, state: $state) {
      id
      state
    }
  }
`

export const Loading = () => (
  <p className="p-6 text-muted-foreground">Loading round…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

const stateColors: Record<string, string> = {
  upcoming: 'bg-muted text-muted-foreground',
  submitting: 'bg-blue-500/15 text-blue-400',
  voting: 'bg-amber-500/15 text-amber-400',
  results: 'bg-green-500/15 text-green-400',
}

const nextState: Record<string, string> = {
  upcoming: 'submitting',
  submitting: 'voting',
  voting: 'results',
}

const nextStateLabel: Record<string, string> = {
  upcoming: 'Open Submissions',
  submitting: 'Open Voting',
  voting: 'Reveal Results',
}

export const Success = ({
  round,
  roundProgress,
}: {
  round: FindRoundQuery['round']
  roundProgress: FindRoundQuery['roundProgress']
}) => {
  const { currentUser } = useAuth()
  const [advancing, setAdvancing] = useState(false)

  const [advanceRound] = useMutation(ADVANCE_ROUND, {
    refetchQueries: ['FindRoundQuery'],
    onCompleted: () => setAdvancing(false),
    onError: (error) => {
      toast.error(error.message)
      setAdvancing(false)
    },
  })

  const myProgress = roundProgress.members.find(
    (m) => m.userId === currentUser?.id
  )

  const upcoming = nextState[round.state]
  const progressCount =
    round.state === 'submitting'
      ? roundProgress.submittedCount
      : roundProgress.votedCount
  const progressPct =
    roundProgress.totalMembers > 0
      ? (progressCount / roundProgress.totalMembers) * 100
      : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Round #{round.roundNumber}
          </p>
          <h1 className="text-2xl font-bold">{round.theme}</h1>
          {round.description && (
            <p className="mt-1 text-muted-foreground">{round.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${stateColors[round.state] ?? ''}`}
          >
            {round.state}
          </span>
          {upcoming && (
            <Button
              size="sm"
              disabled={advancing}
              onClick={() => {
                setAdvancing(true)
                advanceRound({ variables: { id: round.id, state: upcoming } })
              }}
            >
              {advancing ? '…' : nextStateLabel[round.state]}
            </Button>
          )}
        </div>
      </div>

      {round.state !== 'upcoming' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Round Progress</CardTitle>
            <CardDescription>
              {round.state === 'submitting' &&
                `${roundProgress.submittedCount}/${roundProgress.totalMembers} submitted`}
              {round.state === 'voting' &&
                `${roundProgress.votedCount}/${roundProgress.totalMembers} voted`}
              {round.state === 'results' && 'Round complete'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(round.state === 'submitting' || round.state === 'voting') && (
              <Progress value={progressPct} className="mb-4" />
            )}
            <ul className="space-y-2">
              {roundProgress.members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{member.displayName}</span>
                  <div className="flex gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        member.hasSubmitted
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {member.hasSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                    {(round.state === 'voting' ||
                      round.state === 'results') && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          member.hasVoted
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.hasVoted ? 'Voted' : 'Pending'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {round.state === 'submitting' && !myProgress?.hasSubmitted && (
          <Button
            onClick={() =>
              navigate(
                routes.submitSong({ id: round.leagueId, roundId: round.id })
              )
            }
          >
            Submit a Song
          </Button>
        )}
        {round.state === 'voting' && !myProgress?.hasVoted && (
          <Button
            onClick={() =>
              navigate(routes.vote({ id: round.leagueId, roundId: round.id }))
            }
          >
            Vote
          </Button>
        )}
        {round.state === 'results' && (
          <Button
            onClick={() =>
              navigate(
                routes.results({ id: round.leagueId, roundId: round.id })
              )
            }
          >
            See Results
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to={routes.league({ id: round.leagueId })}>Back to League</Link>
        </Button>
      </div>
    </div>
  )
}
