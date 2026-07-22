import { useState } from 'react'

import { Link, navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import TrackSearch, {
  type TrackResult,
} from 'src/components/TrackSearch/TrackSearch'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'

const CREATE_SUBMISSION = gql`
  mutation CreateSubmissionMutation($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
    }
  }
`

type SubmitSongPageProps = {
  id: string
  roundId: string
}

const platformLabel: Record<string, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
}

const formatDuration = (ms?: number | null): string => {
  if (!ms) return ''
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const SubmitSongPage = ({ id, roundId }: SubmitSongPageProps) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null)

  const [createSubmission, { loading }] = useMutation(CREATE_SUBMISSION, {
    onCompleted: () => {
      toast.success('Song submitted!')
      navigate(routes.round({ id, roundId }))
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = () => {
    if (!selectedTrack) return
    createSubmission({
      variables: {
        input: {
          roundId,
          platform: selectedTrack.platform,
          platformTrackId: selectedTrack.platformTrackId,
          trackUrl: selectedTrack.trackUrl,
          trackName: selectedTrack.trackName,
          artistName: selectedTrack.artistName,
          albumName: selectedTrack.albumName,
          artworkUrl: selectedTrack.artworkUrl,
          durationMs: selectedTrack.durationMs,
        },
      },
    })
  }

  return (
    <>
      <Metadata title="Submit a Song" />

      <div className="mx-auto w-full max-w-lg space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Submit a Song</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search for a track or paste a link.
          </p>
        </div>

        {selectedTrack ? (
          <>
            <Card className="border-primary">
              <CardContent className="flex items-center gap-4 py-4">
                {selectedTrack.artworkUrl ? (
                  <img
                    src={selectedTrack.artworkUrl}
                    alt=""
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs">
                    {platformLabel[selectedTrack.platform] ??
                      selectedTrack.platform}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {selectedTrack.trackName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedTrack.artistName}
                  </p>
                  {selectedTrack.albumName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedTrack.albumName}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {platformLabel[selectedTrack.platform] ??
                      selectedTrack.platform}
                    {selectedTrack.durationMs && (
                      <>
                        <span className="mx-1">·</span>
                        {formatDuration(selectedTrack.durationMs)}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTrack(null)}
                >
                  Change
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit Song'}
              </Button>
              <Button variant="outline" asChild>
                <Link to={routes.round({ id, roundId })}>Cancel</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <TrackSearch onSelect={setSelectedTrack} />
            <Button variant="outline" asChild>
              <Link to={routes.round({ id, roundId })}>Cancel</Link>
            </Button>
          </>
        )}
      </div>
    </>
  )
}

export default SubmitSongPage
