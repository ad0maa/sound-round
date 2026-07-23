import { useState } from 'react'

import {
  Check,
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
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { Separator } from 'src/components/ui/separator'

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
  <p className="p-6 text-muted-foreground">Loading league…</p>
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

export const Success = ({ league }: { league: FindLeagueQuery['league'] }) => {
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{league.name}</h1>
            <Badge variant="outline" className="gap-1">
              {league.isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {league.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          {league.description && (
            <p className="mt-1 text-muted-foreground">{league.description}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={routes.leaderboard({ id: league.id })}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </Button>
          {inviteLink && (
            <Button variant="outline" size="sm" onClick={copyInviteLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Invite Link'}
            </Button>
          )}
        </div>
      </div>

      {/* Not started yet */}
      {!league.hasStarted && !league.isFinished && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
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
                size="sm"
                disabled={starting}
                onClick={() => startLeague({ variables: { id: league.id } })}
              >
                <Play className="h-4 w-4" />
                {starting ? 'Starting…' : 'Start League'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finished */}
      {league.isFinished && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-6 w-6 text-green-400" />
              <div>
                <p className="font-medium">League finished!</p>
                <p className="text-sm text-muted-foreground">
                  All {league.totalRounds} rounds are complete.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to={routes.leaderboard({ id: league.id })}>
                <Trophy className="h-4 w-4" />
                See the winner
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rounds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rounds</h2>
          {canManage && !league.isFinished && (
            <Button asChild size="sm">
              <Link to={routes.newRound({ id: league.id })}>New Round</Link>
            </Button>
          )}
        </div>

        {league.rounds.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No rounds yet.{' '}
                {canManage
                  ? 'Create the first one!'
                  : 'Waiting on the creator.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {league.rounds.map((round) => (
              <Link
                key={round.id}
                to={routes.round({ id: league.id, roundId: round.id })}
              >
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="space-y-1 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          #{round.roundNumber}
                        </span>
                        <span className="font-medium">{round.theme}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${stateColors[round.state] ?? ''}`}
                      >
                        {round.state}
                      </span>
                    </div>
                    {round.description && (
                      <p className="text-sm text-muted-foreground">
                        {round.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {round.submissionCount ?? 0} submission
                      {round.submissionCount === 1 ? '' : 's'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Members */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Members ({league.memberCount ?? league.members.length})
        </h2>
        <Card>
          <CardContent className="py-3">
            <ul className="divide-y divide-border">
              {league.members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between py-2"
                >
                  <span>{member.user.displayName}</span>
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
