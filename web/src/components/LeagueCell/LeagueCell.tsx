import { useState } from 'react'

import {
  Check,
  Clock,
  Copy,
  Globe,
  Lock,
  PartyPopper,
  Play,
  Trophy,
} from 'lucide-react'
import type { FindLeagueQuery, FindLeagueQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation, useQuery } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import Countdown from 'src/components/Countdown/Countdown'
import PageContainer from 'src/components/PageContainer/PageContainer'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'

export const QUERY: TypedDocumentNode<
  FindLeagueQuery,
  FindLeagueQueryVariables
> = gql`
  query FindLeagueQuery($id: String!) {
    league(id: $id) {
      id
      name
      description
      inviteCode
      isPublic
      memberCount
      myRole
      upvotesPerRound
      totalRounds
      maxPlayers
      startsAt
      hasStarted
      isFinished
      members {
        userId
        role
        user {
          displayName
        }
      }
      rounds {
        id
        roundNumber
        theme
        description
        state
        submissionCount
        submissionsClose
        votingClose
      }
    }
  }
`

const LEADERBOARD_PREVIEW = gql`
  query LeagueHubLeaderboardPreviewQuery($leagueId: String!) {
    leagueLeaderboard(leagueId: $leagueId) {
      totalPoints
      user {
        id
        displayName
      }
    }
  }
`

const START_LEAGUE = gql`
  mutation StartLeagueMutation($id: String!) {
    startLeague(id: $id) {
      id
    }
  }
`

export const Loading = () => (
  <PageContainer>
    <p className="text-muted-foreground">Loading league…</p>
  </PageContainer>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <PageContainer>
    <p className="text-destructive">Error: {error?.message}</p>
  </PageContainer>
)

const roundKind = (state: string) =>
  state === 'results' ? 'done' : state === 'upcoming' ? 'up' : 'active'

const numClassFor: Record<string, string> = {
  done: 'bg-brand2-200 text-brand2-800 dark:bg-brand2-800 dark:text-brand2-100',
  active: 'bg-brand-600 text-white',
  up: 'bg-sand-200 text-sand-700 dark:bg-sand-800 dark:text-sand-300',
}

const tagVariantFor: Record<string, 'secondary' | 'default' | 'outline'> = {
  done: 'secondary',
  active: 'default',
  up: 'outline',
}

const tagLabelFor: Record<string, string> = {
  done: 'results',
  active: 'live',
  up: 'upcoming',
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const Success = ({
  league,
  queryResult,
}: {
  league: FindLeagueQuery['league']
  queryResult?: { refetch?: () => unknown }
}) => {
  const { currentUser } = useAuth()
  const [copied, setCopied] = useState(false)

  const { data: leaderboardData } = useQuery(LEADERBOARD_PREVIEW, {
    variables: { leagueId: league.id },
    skip: !league.hasStarted,
  })

  const inviteLink = league.inviteCode
    ? `${window.location.origin}/join/${league.inviteCode}`
    : ''

  const copyInviteLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canManage = league.myRole === 'creator' || league.myRole === 'admin'

  const [startLeague, { loading: starting }] = useMutation(START_LEAGUE, {
    onCompleted: () => toast.success('League started — round 1 is open!'),
    onError: (error) => toast.error(error.message),
    refetchQueries: [{ query: QUERY, variables: { id: league.id } }],
    awaitRefetchQueries: true,
  })

  const creator = league.members.find((m) => m.role === 'creator')
  const hostLabel =
    creator?.userId === currentUser?.id
      ? 'you'
      : (creator?.user.displayName ?? 'the creator')

  const currentRound = league.rounds.find(
    (r) => r.state === 'voting' || r.state === 'submitting'
  )
  const isVotingNow = currentRound?.state === 'voting'
  const currentDeadline = isVotingNow
    ? currentRound?.votingClose
    : currentRound?.submissionsClose

  const standings = [...(leaderboardData?.leagueLeaderboard ?? [])]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 4)

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[38px]">{league.name}</h1>
            <Badge variant="secondary" className="gap-1">
              {league.isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {league.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {league.memberCount ?? 0} members · {league.totalRounds} rounds ·
            hosted by {hostLabel}
          </p>
        </div>
        <div className="ml-auto flex gap-2.5">
          <Button asChild variant="secondary">
            <Link to={routes.leaderboard({ id: league.id })}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </Button>
          {inviteLink && (
            <Button onClick={copyInviteLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Invite link'}
            </Button>
          )}
        </div>
      </div>

      {/* Not started yet */}
      {!league.hasStarted && !league.isFinished && (
        <Card className="mb-5 border border-brand/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">This league hasn&apos;t started yet</p>
              <p className="text-sm text-muted-foreground">
                {league.startsAt
                  ? `Starts ${new Date(league.startsAt).toLocaleString()}, or when ${league.maxPlayers} players join.`
                  : `Starts when the creator kicks it off, or when ${league.maxPlayers} players join.`}
              </p>
            </div>
            {canManage && (
              <Button
                disabled={starting}
                onClick={() => startLeague({ variables: { id: league.id } })}
              >
                <Play className="h-4 w-4" />
                {starting ? 'Starting…' : 'Start League'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Finished */}
      {league.isFinished && (
        <Card className="mb-5 border border-brand2/40 bg-brand2-100 dark:bg-brand2-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-6 w-6 text-brand2-700" />
              <div>
                <p className="font-medium">League finished!</p>
                <p className="text-sm text-muted-foreground">
                  All {league.totalRounds} rounds are complete.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to={routes.leaderboard({ id: league.id })}>
                <Trophy className="h-4 w-4" />
                See the winner
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Active round summary */}
      {currentRound && (
        <Card className="mb-5 gap-3.5 border border-brand shadow-md">
          <div className="flex items-center gap-2 text-brand">
            <span className="livedot" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
              {isVotingNow ? 'Now voting' : 'Now submitting'}
            </span>
            {currentDeadline && (
              <span className="ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Clock className="h-[15px] w-[15px]" strokeWidth={2.5} />
                <Countdown
                  deadline={currentDeadline}
                  onExpire={() => queryResult?.refetch?.()}
                />
              </span>
            )}
          </div>
          <div>
            <div className="font-heading text-[25px] leading-tight">
              Round {currentRound.roundNumber} · {currentRound.theme}
            </div>
            {currentRound.description && (
              <p className="mt-1 text-muted-foreground">
                {currentRound.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild className="px-6">
              <Link
                to={
                  isVotingNow
                    ? routes.vote({ id: league.id, roundId: currentRound.id })
                    : routes.submitSong({
                        id: league.id,
                        roundId: currentRound.id,
                      })
                }
              >
                {isVotingNow ? 'Cast your votes' : 'Submit a song'}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link
                to={routes.round({ id: league.id, roundId: currentRound.id })}
              >
                Round details
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Rounds */}
      <div className="mb-3 flex items-center">
        <h2 className="text-[24px]">Rounds</h2>
        {canManage && !league.isFinished && (
          <Button asChild variant="ghost" className="ml-auto">
            <Link to={routes.newRound({ id: league.id })}>+ New round</Link>
          </Button>
        )}
      </div>

      {league.rounds.length === 0 ? (
        <Card className="mb-6 items-center py-8 text-center">
          <p className="text-muted-foreground">
            No rounds yet.{' '}
            {canManage ? 'Create the first one!' : 'Waiting on the creator.'}
          </p>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {league.rounds.map((round) => {
            const kind = roundKind(round.state)
            return (
              <Link
                key={round.id}
                to={routes.round({ id: league.id, roundId: round.id })}
              >
                <Card
                  className={cn(
                    'flex-row items-center gap-3.5 px-4 py-3.5',
                    kind === 'active' && 'border border-brand',
                    kind === 'up' && 'opacity-70'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-sm font-bold',
                      numClassFor[kind]
                    )}
                  >
                    {round.roundNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{round.theme}</div>
                    <div className="text-xs text-muted-foreground">
                      {kind === 'up'
                        ? `Opens after round ${round.roundNumber - 1}`
                        : `${round.submissionCount ?? 0} submission${round.submissionCount === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <Badge variant={tagVariantFor[kind]}>
                    {tagLabelFor[kind]}
                  </Badge>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
            Standings
          </div>
          <div className="mt-1 flex flex-col gap-2.5">
            {standings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {league.hasStarted
                  ? 'No results yet.'
                  : 'Standings appear once the league starts.'}
              </p>
            ) : (
              standings.map((entry, index) => {
                const isYou = entry.user.id === currentUser?.id
                return (
                  <div
                    key={entry.user.id}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-1.5 py-1',
                      isYou && 'bg-brand-100 dark:bg-brand-900'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-xs font-bold',
                        index < 3
                          ? 'bg-brand-600 text-white'
                          : 'bg-sand-200 text-sand-700 dark:bg-sand-800 dark:text-sand-300'
                      )}
                    >
                      {index + 1}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[11px]">
                        {initialsOf(entry.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm font-semibold">
                      {entry.user.displayName}
                    </span>
                    <span className="font-bold">{entry.totalPoints}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
            Members · {league.memberCount ?? league.members.length}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {league.members.map((member) => {
              const isYou = member.userId === currentUser?.id
              const label = isYou
                ? member.role === 'creator'
                  ? 'You · host'
                  : 'You'
                : member.user.displayName
              return (
                <Badge
                  key={member.userId}
                  variant={isYou ? 'default' : 'outline'}
                >
                  {label}
                </Badge>
              )
            })}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
