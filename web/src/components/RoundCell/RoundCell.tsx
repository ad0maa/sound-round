import { useState } from 'react'

import { ArrowLeft } from 'lucide-react'
import type { FindRoundQuery, FindRoundQueryVariables } from 'types/graphql'

import { Link, navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import Countdown from 'src/components/Countdown/Countdown'
import PageContainer from 'src/components/PageContainer/PageContainer'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
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
        submissionsClose
        votingClose
        league {
          id
          myRole
        }
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
  <PageContainer>
    <p className="text-muted-foreground">Loading round…</p>
  </PageContainer>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <PageContainer>
    <p className="text-destructive">Error: {error?.message}</p>
  </PageContainer>
)

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

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const Success = ({
  round,
  roundProgress,
  queryResult,
}: {
  round: FindRoundQuery['round']
  roundProgress: FindRoundQuery['roundProgress']
  queryResult?: { refetch?: () => unknown }
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

  const canManage =
    round.league.myRole === 'creator' || round.league.myRole === 'admin'

  // When a deadline hits, refetch — the server settles the round lazily, so
  // the page rolls into the next phase without a manual refresh.
  const onDeadline = () => queryResult?.refetch?.()

  const deadline =
    round.state === 'submitting'
      ? round.submissionsClose
      : round.state === 'voting'
        ? round.votingClose
        : null

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
    <PageContainer>
      <Button asChild variant="ghost" className="mb-3.5 -ml-1">
        <Link to={routes.league({ id: round.leagueId })}>
          <ArrowLeft className="h-4 w-4" />
          Back to league
        </Link>
      </Button>

      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
            Round {round.roundNumber}
          </p>
          <h1 className="mt-0.5 text-[36px]">{round.theme}</h1>
          {round.description && (
            <p className="mt-1.5 text-muted-foreground">{round.description}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {deadline && <Countdown deadline={deadline} onExpire={onDeadline} />}
          <Badge
            variant={
              round.state === 'results'
                ? 'secondary'
                : round.state === 'upcoming'
                  ? 'outline'
                  : 'default'
            }
          >
            {round.state}
          </Badge>
          {upcoming && canManage && (
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
        <Card className="mb-5 gap-3.5">
          <div className="flex items-center">
            <div className="font-heading text-[17px]">Round progress</div>
            {deadline && (
              <span className="ml-auto flex items-center gap-1.5 text-[13px] text-brand">
                <span className="livedot" />
                <Countdown deadline={deadline} onExpire={onDeadline} />
              </span>
            )}
          </div>
          {(round.state === 'submitting' || round.state === 'voting') && (
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>
                  {round.state === 'submitting'
                    ? `${roundProgress.submittedCount} of ${roundProgress.totalMembers} submitted`
                    : `${roundProgress.votedCount} of ${roundProgress.totalMembers} voted`}
                </span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            {roundProgress.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2.5 text-sm"
              >
                <Avatar className="h-[26px] w-[26px]">
                  <AvatarFallback className="text-[10px]">
                    {initialsOf(member.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1">{member.displayName}</span>
                <Badge variant={member.hasSubmitted ? 'secondary' : 'outline'}>
                  {member.hasSubmitted ? 'submitted' : 'pending'}
                </Badge>
                {(round.state === 'voting' || round.state === 'results') && (
                  <Badge variant={member.hasVoted ? 'secondary' : 'outline'}>
                    {member.hasVoted ? 'voted' : 'pending'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-2.5">
        {round.state === 'submitting' && !myProgress?.hasSubmitted && (
          <Button
            className="h-auto flex-1 py-3.5 text-base"
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
            className="h-auto flex-1 py-3.5 text-base"
            onClick={() =>
              navigate(routes.vote({ id: round.leagueId, roundId: round.id }))
            }
          >
            Cast your votes →
          </Button>
        )}
        {round.state === 'results' && (
          <Button
            className="h-auto flex-1 py-3.5 text-base"
            onClick={() =>
              navigate(
                routes.results({ id: round.leagueId, roundId: round.id })
              )
            }
          >
            See Results
          </Button>
        )}
      </div>
    </PageContainer>
  )
}
