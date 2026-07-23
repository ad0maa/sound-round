import { useState } from 'react'

import { Link, navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import PageContainer from 'src/components/PageContainer/PageContainer'
import TrackSearch, {
  type TrackResult,
} from 'src/components/TrackSearch/TrackSearch'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'

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
  const [blurb, setBlurb] = useState('')

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
          blurb: blurb.trim() || null,
        },
      },
    })
  }

  return (
    <>
      <Metadata title="Submit a Song" />

      <PageContainer className="max-w-lg space-y-4" wide={false}>
        <div>
          <h1 className="text-[32px]">Submit a Song</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search for a track or paste a link.
          </p>
        </div>

        {selectedTrack ? (
          <>
            <Card className="border border-brand">
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

            <div className="space-y-2">
              <Label htmlFor="blurb">Why this song? (optional)</Label>
              <Textarea
                id="blurb"
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                maxLength={300}
                placeholder="A line about why you picked it — shown anonymously during voting, with your name at results."
              />
              <p className="text-right text-xs text-muted-foreground">
                {blurb.length}/300
              </p>
            </div>

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
      </PageContainer>
    </>
  )
}

export default SubmitSongPage
