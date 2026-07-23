import { useState } from 'react'

import { Check, Copy, ListVideo } from 'lucide-react'
import type { FindResultsQuery, FindResultsQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

import RoundCommentsCell from 'src/components/RoundCommentsCell'
import TrackEmbed from 'src/components/TrackEmbed/TrackEmbed'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { trackListText, youtubeQueueUrl } from 'src/lib/playlist'

export const QUERY: TypedDocumentNode<
  FindResultsQuery,
  FindResultsQueryVariables
> = gql`
  query FindResultsQuery($roundId: String!) {
    round(id: $roundId) {
      id
      leagueId
      roundNumber
      theme
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
      totalPoints
      submitter {
        displayName
      }
      votes {
        voterName
        points
      }
    }
  }
`

export const Loading = () => (
  <p className="p-6 text-muted-foreground">Loading results…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

const medals = ['🥇', '🥈', '🥉']

export const Success = ({
  round,
  submissions,
}: {
  round: FindResultsQuery['round']
  submissions: FindResultsQuery['submissions']
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const sorted = [...submissions].sort(
    (a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
  )

  const queueUrl = youtubeQueueUrl(sorted)

  const copyTrackList = () => {
    navigator.clipboard.writeText(trackListText(sorted))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Round #{round.roundNumber} Results
          </p>
          <h1 className="text-2xl font-bold">{round.theme}</h1>
        </div>
        {round.state === 'results' && sorted.length > 0 && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={copyTrackList}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy track list'}
            </Button>
            {queueUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={queueUrl} target="_blank" rel="noreferrer">
                  <ListVideo className="h-4 w-4" />
                  Open as YouTube playlist
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {round.state !== 'results' ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Results haven&apos;t been revealed yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((sub, i) => (
            <Card key={sub.id} className={i === 0 ? 'border border-brand' : ''}>
              <CardContent className="space-y-3 py-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-4 text-left"
                  onClick={() =>
                    setExpandedId(expandedId === sub.id ? null : sub.id)
                  }
                >
                  <span className="w-10 flex-shrink-0 text-center text-2xl">
                    {i < 3 ? medals[i] : `${i + 1}.`}
                  </span>
                  {sub.artworkUrl && (
                    <img
                      src={sub.artworkUrl}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{sub.trackName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {sub.artistName}
                      {sub.submitter && (
                        <>
                          <span className="mx-1">·</span>
                          submitted by {sub.submitter.displayName}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xl font-bold">
                    {sub.totalPoints ?? 0}
                  </span>
                </button>

                {expandedId === sub.id && (
                  <>
                    {sub.blurb && (
                      <p className="text-sm italic text-muted-foreground">
                        “{sub.blurb}”
                        {sub.submitter && <> — {sub.submitter.displayName}</>}
                      </p>
                    )}
                    <TrackEmbed
                      platform={sub.platform}
                      platformTrackId={sub.platformTrackId}
                      trackUrl={sub.trackUrl}
                    />
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Votes
                      </p>
                      {sub.votes && sub.votes.length > 0 ? (
                        <ul className="space-y-1">
                          {sub.votes.map((v, vi) => (
                            <li
                              key={vi}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{v.voterName}</span>
                              <span className="font-medium">
                                {v.points > 0 ? `+${v.points}` : v.points}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No votes for this song.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {round.state === 'results' && <RoundCommentsCell roundId={round.id} />}

      <Button variant="outline" asChild>
        <Link to={routes.round({ id: round.leagueId, roundId: round.id })}>
          Back to Round
        </Link>
      </Button>
    </div>
  )
}
