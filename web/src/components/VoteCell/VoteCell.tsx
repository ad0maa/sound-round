import { useState } from 'react'

import {
  ArrowLeft,
  ListMusic,
  Minus,
  Music,
  Pause,
  Play,
  Plus,
} from 'lucide-react'
import type { FindVoteQuery, FindVoteQueryVariables } from 'types/graphql'

import { Link, navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import PageContainer from 'src/components/PageContainer/PageContainer'
import PlayerDock from 'src/components/Player/PlayerDock'
import {
  PlayerProvider,
  usePlayer,
  type QueueTrack,
} from 'src/components/Player/PlayerProvider'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'
import { ballotRemaining } from 'src/lib/voteBudget'

export const QUERY: TypedDocumentNode<FindVoteQuery, FindVoteQueryVariables> =
  gql`
    query FindVoteQuery($leagueId: String!, $roundId: String!) {
      league(id: $leagueId) {
        id
        upvotesPerRound
        maxPointsPerSong
        downvotesEnabled
        downvotesPerRound
        maxDownvotesPerSong
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
        blurb
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

export const Success = (props: VoteCellProps) => (
  <PlayerProvider>
    <VoteContent {...props} />
    <PlayerDock />
  </PlayerProvider>
)

const VoteContent = ({
  league,
  round,
  submissions,
  myVotes,
  leagueId,
  roundId,
}: VoteCellProps) => {
  const others = submissions.filter((s) => !s.isMine)

  const queueTracks: QueueTrack[] = others.map((s) => ({
    submissionId: s.id,
    platform: s.platform,
    platformTrackId: s.platformTrackId,
    trackUrl: s.trackUrl,
    trackName: s.trackName,
    artistName: s.artistName,
    artworkUrl: s.artworkUrl,
  }))

  const { currentTrack, isPlaying, playAll, playTrack, togglePlay } =
    usePlayer()
  const downvotesEnabled = league.downvotesEnabled

  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const v of myVotes) {
      initial[v.submissionId] = v.points
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)

  /** The ballot as the budget helpers want it: one entry per votable song. */
  const ballotFor = (current: Record<string, number>) =>
    ballotRemaining(
      league,
      others.map((s) => current[s.id] ?? 0)
    )

  const ballot = ballotFor(votes)
  const { capUp, capDown, effectiveUp, effectiveDown } = ballot
  const ballotComplete = !ballot.canPlaceUp && !ballot.canPlaceDown

  /**
   * Nudge one song's score by ±1.
   *
   * Everything is derived from `prev` inside the updater rather than from the
   * render's snapshot. Taking a delta matters as much as clamping against
   * `prev`: an absolute target computed at render time (`pts + 1`) collapses
   * to the same value for every click in a batch, so a burst of clicks either
   * registered once or overspent the budget the server enforces.
   */
  const stepPoints = (submissionId: string, delta: number) => {
    setVotes((prev) => {
      const live = ballotFor(prev)
      const current = prev[submissionId] ?? 0

      let next = Math.max(-capDown, Math.min(capUp, current + delta))
      if (!downvotesEnabled && next < 0) {
        next = 0
      }

      const upDiff = Math.max(0, next) - Math.max(0, current)
      if (upDiff > 0 && live.upRemaining < upDiff) {
        next = Math.max(0, current) + live.upRemaining
      }
      const downDiff = Math.max(0, -next) - Math.max(0, -current)
      if (downDiff > 0 && live.downRemaining < downDiff) {
        next = -(Math.max(0, -current) + live.downRemaining)
      }

      return { ...prev, [submissionId]: next }
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
            Listen to each track, then spread all {effectiveUp} of your points.
            Give more to your favourites.
            {downvotesEnabled &&
              effectiveDown > 0 &&
              ` You also have ${effectiveDown} downvote${effectiveDown === 1 ? '' : 's'} for tracks you'd rather not hear again.`}
          </p>
          {others.length > 0 && (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => playAll(queueTracks)}
            >
              <ListMusic className="h-4 w-4" />
              Play all
            </Button>
          )}
        </div>
        <div className="ml-auto flex gap-6 text-right">
          <div>
            <div
              className={cn(
                'font-heading text-[40px] leading-none',
                ballot.upRemaining === 0 ? 'text-brand' : 'text-foreground'
              )}
            >
              {ballot.upRemaining}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              points left
            </div>
          </div>
          {downvotesEnabled && effectiveDown > 0 && (
            <div>
              <div
                className={cn(
                  'font-heading text-[40px] leading-none',
                  ballot.downRemaining === 0
                    ? 'text-destructive'
                    : 'text-foreground'
                )}
              >
                {ballot.downRemaining}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                downvotes left
              </div>
            </div>
          )}
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
        <div
          className={cn(
            'my-5 flex flex-col gap-3',
            currentTrack && 'pb-44 nav:pb-40'
          )}
        >
          {others.map((sub) => {
            const pts = votes[sub.id] ?? 0
            const isCurrent = currentTrack?.submissionId === sub.id
            return (
              <Card
                key={sub.id}
                className={cn(
                  'gap-3',
                  pts > 0 && 'border border-brand',
                  pts < 0 && 'border border-destructive',
                  isCurrent && 'ring-2 ring-brand/50'
                )}
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
                  <button
                    type="button"
                    className={cn(
                      stepBtnClass,
                      isCurrent &&
                        'border-brand bg-brand text-white enabled:hover:text-white'
                    )}
                    onClick={() =>
                      isCurrent ? togglePlay() : playTrack(queueTracks, sub.id)
                    }
                    aria-label={
                      isCurrent && isPlaying
                        ? `Pause ${sub.trackName}`
                        : `Play ${sub.trackName}`
                    }
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" />
                    )}
                  </button>
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
                      onClick={() => stepPoints(sub.id, -1)}
                      disabled={
                        pts <= 0 &&
                        (!downvotesEnabled ||
                          ballot.downRemaining <= 0 ||
                          -pts >= capDown)
                      }
                      aria-label={
                        pts > 0
                          ? `Remove a point from ${sub.trackName}`
                          : `Downvote ${sub.trackName}`
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      className={cn(
                        'w-[26px] text-center font-heading text-[22px]',
                        pts < 0 && 'text-destructive'
                      )}
                    >
                      {pts}
                    </span>
                    <button
                      type="button"
                      className={stepBtnClass}
                      onClick={() => stepPoints(sub.id, 1)}
                      disabled={
                        pts >= 0 && (ballot.upRemaining <= 0 || pts >= capUp)
                      }
                      aria-label={
                        pts < 0
                          ? `Remove a downvote from ${sub.trackName}`
                          : `Add a point to ${sub.trackName}`
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {sub.blurb && (
                  <p className="text-[13px] italic text-muted-foreground">
                    “{sub.blurb}”
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Button
        className="h-auto w-full py-3.5 text-base"
        onClick={handleSubmit}
        disabled={submitting || others.length === 0 || !ballotComplete}
      >
        {submitting ? 'Submitting…' : 'Submit votes'}
      </Button>
      {others.length > 0 && !ballotComplete && (
        <p className="mt-2.5 text-center text-[13px] text-muted-foreground">
          {ballot.canPlaceUp
            ? `Place your last ${ballot.upRemaining} point${ballot.upRemaining === 1 ? '' : 's'} to submit.`
            : `Place your last ${ballot.downRemaining} downvote${ballot.downRemaining === 1 ? '' : 's'} to submit.`}
        </p>
      )}
    </PageContainer>
  )
}
