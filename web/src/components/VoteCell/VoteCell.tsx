import { useState } from 'react'

import { ArrowLeft, Minus, Music, Plus } from 'lucide-react'
import type { FindVoteQuery, FindVoteQueryVariables } from 'types/graphql'

import { Link, navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import PageContainer from 'src/components/PageContainer/PageContainer'
import TrackEmbed from 'src/components/TrackEmbed/TrackEmbed'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'

export const QUERY: TypedDocumentNode<FindVoteQuery, FindVoteQueryVariables> =
  gql`
    query FindVoteQuery($leagueId: String!, $roundId: String!) {
      league(id: $leagueId) {
        id
        upvotesPerRound
        maxPointsPerSong
      }
      round(id: $roundId) {
        id
        state
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
  <PageContainer>
    <p className="text-muted-foreground">Loading submissions…</p>
  </PageContainer>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <PageContainer>
    <p className="text-destructive">Error: {error?.message}</p>
  </PageContainer>
)

type VoteCellProps = FindVoteQuery & FindVoteQueryVariables

const stepBtnClass =
  'grid size-[38px] flex-none place-items-center rounded-full border-[1.5px] border-divider bg-background dark:bg-card text-xl font-bold text-foreground transition-colors enabled:hover:border-brand enabled:hover:text-brand disabled:cursor-not-allowed disabled:opacity-40'

export const Success = ({
  league,
  round,
  submissions,
  myVotes,
  leagueId,
  roundId,
}: VoteCellProps) => {
  const others = submissions.filter((s) => !s.isMine)
  const upvotesPerRound = league.upvotesPerRound
  const maxPointsPerSong = league.maxPointsPerSong

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

  // Guard direct navigation outside the voting window (server enforces too).
  if (round.state !== 'voting') {
    return (
      <PageContainer wide={false}>
        <Card className="items-center gap-4 py-8 text-center">
          <p className="text-muted-foreground">
            {round.state === 'results'
              ? 'Voting has closed for this round.'
              : 'Voting hasn’t opened yet — songs are still being submitted.'}
          </p>
          <Button asChild variant="secondary">
            <Link to={routes.round({ id: leagueId, roundId })}>
              Back to Round
            </Link>
          </Button>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Button asChild variant="ghost" className="mb-3.5 -ml-1">
        <Link to={routes.round({ id: leagueId, roundId })}>
          <ArrowLeft className="h-4 w-4" />
          Back to round
        </Link>
      </Button>

      <div className="mb-3 flex flex-wrap items-start gap-4">
        <div>
          <h1 className="text-[36px]">Vote</h1>
          <p className="mt-1.5 max-w-[48ch] text-muted-foreground">
            Listen to each track, then spread your {upvotesPerRound} points.
            Give more to your favourites.
          </p>
        </div>
        <div className="ml-auto text-right">
          <div
            className={cn(
              'font-heading text-[40px] leading-none',
              pointsRemaining === 0 ? 'text-brand' : 'text-foreground'
            )}
          >
            {pointsRemaining}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            points left
          </div>
        </div>
      </div>

      {others.length === 0 ? (
        <Card className="my-5 items-center py-8 text-center">
          <p className="text-muted-foreground">
            No other submissions to vote on yet. You can only vote on songs
            submitted by other members.
          </p>
        </Card>
      ) : (
        <div className="my-5 flex flex-col gap-3">
          {others.map((sub) => {
            const pts = votes[sub.id] ?? 0
            return (
              <Card
                key={sub.id}
                className={cn('gap-3', pts > 0 && 'border border-brand')}
              >
                <div className="flex items-center gap-3.5">
                  {sub.artworkUrl ? (
                    <img
                      src={sub.artworkUrl}
                      alt=""
                      className="size-[46px] flex-none rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="grid size-[46px] flex-none place-items-center rounded-2xl bg-brand text-white">
                      <Music className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{sub.trackName}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {sub.artistName}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <button
                      type="button"
                      className={stepBtnClass}
                      onClick={() => setPoints(sub.id, pts - 1)}
                      disabled={pts <= 0}
                      aria-label={`Remove a point from ${sub.trackName}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-[26px] text-center font-heading text-[22px]">
                      {pts}
                    </span>
                    <button
                      type="button"
                      className={stepBtnClass}
                      onClick={() => setPoints(sub.id, pts + 1)}
                      disabled={
                        pointsRemaining <= 0 ||
                        (maxPointsPerSong != null && pts >= maxPointsPerSong)
                      }
                      aria-label={`Add a point to ${sub.trackName}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <TrackEmbed
                  platform={sub.platform}
                  platformTrackId={sub.platformTrackId}
                  trackUrl={sub.trackUrl}
                  compact
                />
              </Card>
            )
          })}
        </div>
      )}

      <Button
        className="h-auto w-full py-3.5 text-base"
        onClick={handleSubmit}
        disabled={submitting || others.length === 0}
      >
        {submitting ? 'Submitting…' : 'Submit votes'}
      </Button>
    </PageContainer>
  )
}
