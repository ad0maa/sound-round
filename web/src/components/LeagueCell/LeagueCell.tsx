import { useState } from 'react'

import { Check, Copy, Trophy } from 'lucide-react'
import type { FindLeagueQuery, FindLeagueQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

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
      memberCount
      myRole
      upvotesPerRound
      totalRounds
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
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

      {/* Rounds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rounds</h2>
          {canManage && (
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
