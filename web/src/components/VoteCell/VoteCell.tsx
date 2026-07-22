import { useState } from 'react'

import type { FindVoteQuery, FindVoteQueryVariables } from 'types/graphql'

import { navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import TrackEmbed from 'src/components/TrackEmbed/TrackEmbed'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'

export const QUERY: TypedDocumentNode<FindVoteQuery, FindVoteQueryVariables> =
  gql`
    query FindVoteQuery($leagueId: String!, $roundId: String!) {
      league(id: $leagueId) {
        id
        upvotesPerRound
      }
      submissions(roundId: $roundId) {
        id
        trackName
        artistName
        artworkUrl
        platform
        platformTrackId
        trackUrl
        isMine
      }
      myVotes(roundId: $roundId) {
        submissionId
        points
      }
    }
  `

const CAST_VOTES = gql`
  mutation CastVotesMutation($roundId: String!, $votes: [VoteInput!]!) {
    castVotes(roundId: $roundId, votes: $votes) {
      id
    }
  }
`

export const Loading = () => (
  <p className="p-6 text-muted-foreground">Loading submissions…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

type VoteCellProps = FindVoteQuery & FindVoteQueryVariables

export const Success = ({
  league,
  submissions,
  myVotes,
  leagueId,
  roundId,
}: VoteCellProps) => {
  const others = submissions.filter((s) => !s.isMine)
  const upvotesPerRound = league.upvotesPerRound

  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const v of myVotes) {
      initial[v.submissionId] = v.points
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)

  const pointsUsed = Object.values(votes).reduce(
    (sum, v) => sum + Math.max(0, v),
    0
  )
  const pointsRemaining = upvotesPerRound - pointsUsed

  const setPoints = (submissionId: string, points: number) => {
    const current = votes[submissionId] ?? 0
    const diff = points - current

    setVotes((prev) => {
      if (diff > 0 && pointsRemaining < diff) {
        return { ...prev, [submissionId]: current + pointsRemaining }
      }
      if (points < 0) {
        return { ...prev, [submissionId]: 0 }
      }
      return { ...prev, [submissionId]: points }
    })
  }

  const [castVotes] = useMutation(CAST_VOTES, {
    onCompleted: () => navigate(routes.round({ id: leagueId, roundId })),
    onError: (error) => {
      toast.error(error.message)
      setSubmitting(false)
    },
  })

  const handleSubmit = () => {
    setSubmitting(true)
    const voteEntries = Object.entries(votes)
      .filter(([, points]) => points !== 0)
      .map(([submissionId, points]) => ({ submissionId, points }))

    castVotes({ variables: { roundId, votes: voteEntries } })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vote</h1>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${pointsRemaining === 0 ? 'text-green-500' : ''}`}
          >
            {pointsRemaining}
          </p>
          <p className="text-xs text-muted-foreground">points remaining</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Listen to each track, then distribute your {upvotesPerRound} points. You
        can give multiple points to your favourites.
      </p>

      {others.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No other submissions to vote on yet. You can only vote on songs
              submitted by other members.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {others.map((sub) => {
            const pts = votes[sub.id] ?? 0
            return (
              <Card key={sub.id} className={pts > 0 ? 'border-primary' : ''}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {sub.artworkUrl && (
                        <img
                          src={sub.artworkUrl}
                          alt=""
                          className="h-10 w-10 flex-shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{sub.trackName}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {sub.artistName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPoints(sub.id, pts - 1)}
                        disabled={pts <= 0}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-lg font-bold">
                        {pts}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPoints(sub.id, pts + 1)}
                        disabled={pointsRemaining <= 0}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <TrackEmbed
                    platform={sub.platform}
                    platformTrackId={sub.platformTrackId}
                    trackUrl={sub.trackUrl}
                    compact
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={submitting || others.length === 0}
        >
          {submitting ? 'Submitting…' : 'Submit Votes'}
        </Button>
      </div>
    </div>
  )
}
