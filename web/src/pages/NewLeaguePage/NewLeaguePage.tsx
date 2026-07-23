import { useState } from 'react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import PageContainer from 'src/components/PageContainer/PageContainer'
import PageHeader from 'src/components/PageHeader/PageHeader'
import { Button } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Switch } from 'src/components/ui/switch'

const CREATE_LEAGUE = gql`
  mutation CreateLeagueMutation($input: CreateLeagueInput!) {
    createLeague(input: $input) {
      id
    }
  }
`

type RoundDraft = {
  theme: string
  description: string
  submissionDurationHours: string
  votingDurationHours: string
}

const emptyRound = (): RoundDraft => ({
  theme: '',
  description: '',
  submissionDurationHours: '',
  votingDurationHours: '',
})

const NewLeaguePage = () => {
  const [step, setStep] = useState<1 | 2>(1)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [upvotesPerRound, setUpvotesPerRound] = useState(10)
  const [downvotesEnabled, setDownvotesEnabled] = useState(false)
  const [downvotesPerRound, setDownvotesPerRound] = useState(0)
  const [maxPointsPerSong, setMaxPointsPerSong] = useState('')
  const [uniqueArtists, setUniqueArtists] = useState(false)
  const [totalRounds, setTotalRounds] = useState(5)
  const [maxPlayers, setMaxPlayers] = useState(20)
  const [isPublic, setIsPublic] = useState(false)
  const [submissionDeadlineHours, setSubmissionDeadlineHours] = useState(72)
  const [votingDeadlineHours, setVotingDeadlineHours] = useState(48)
  const [startsAt, setStartsAt] = useState('')

  const [roundDrafts, setRoundDrafts] = useState<RoundDraft[]>([emptyRound()])

  const [createLeague, { loading }] = useMutation(CREATE_LEAGUE, {
    onCompleted: (data) => {
      toast.success('League created!')
      navigate(routes.league({ id: data.createLeague.id }))
    },
    onError: (error) => toast.error(error.message),
  })

  const goToRounds = () => {
    if (!name.trim()) {
      toast.error('League name is required')
      return
    }
    // Resize the drafts array to totalRounds, keeping anything already typed.
    setRoundDrafts((drafts) =>
      Array.from({ length: totalRounds }, (_, i) => drafts[i] ?? emptyRound())
    )
    setStep(2)
  }

  const updateDraft = (index: number, patch: Partial<RoundDraft>) => {
    setRoundDrafts((drafts) =>
      drafts.map((d, i) => (i === index ? { ...d, ...patch } : d))
    )
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roundDrafts.some((d) => !d.theme.trim())) {
      toast.error('Every round needs a theme')
      return
    }
    createLeague({
      variables: {
        input: {
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
          upvotesPerRound,
          downvotesEnabled,
          downvotesPerRound: downvotesEnabled ? downvotesPerRound : 0,
          maxPointsPerSong: maxPointsPerSong
            ? parseInt(maxPointsPerSong, 10)
            : null,
          uniqueArtists,
          maxPlayers,
          submissionDeadlineHours,
          votingDeadlineHours,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          rounds: roundDrafts.map((d) => ({
            theme: d.theme.trim(),
            description: d.description.trim() || null,
            submissionDurationHours: d.submissionDurationHours
              ? parseInt(d.submissionDurationHours, 10)
              : null,
            votingDurationHours: d.votingDurationHours
              ? parseInt(d.votingDurationHours, 10)
              : null,
          })),
        },
      },
    })
  }

  return (
    <>
      <Metadata title="New League" />

      <PageContainer className="max-w-lg" wide={false}>
        <PageHeader
          title="New League"
          description={
            step === 1 ? 'Set the rules.' : 'Give each round a theme.'
          }
        />
        <div className="space-y-6">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                goToRounds()
              }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>League details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Friday Bangers"
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- navigating to this page is itself a deliberate action to create a league
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this league about?"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isPublic">Public league</Label>
                      <p className="text-xs text-muted-foreground">
                        {isPublic
                          ? 'Listed on Browse Leagues — anyone can jump in.'
                          : 'Invite-only — share the invite link to add players.'}
                      </p>
                    </div>
                    <Switch
                      id="isPublic"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Scheduled start (optional)</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to start manually. The league also starts
                      automatically when it reaches max players.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rules</CardTitle>
                  <CardDescription>
                    Tune scoring and rounds — sensible defaults included.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalRounds">Rounds</Label>
                      <Input
                        id="totalRounds"
                        type="number"
                        min={1}
                        max={30}
                        value={totalRounds}
                        onChange={(e) =>
                          setTotalRounds(
                            Math.min(30, parseInt(e.target.value, 10) || 1)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPlayers">Max players</Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        min={2}
                        value={maxPlayers}
                        onChange={(e) =>
                          setMaxPlayers(parseInt(e.target.value, 10) || 2)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upvotes">Points per round</Label>
                      <Input
                        id="upvotes"
                        type="number"
                        min={1}
                        value={upvotesPerRound}
                        onChange={(e) =>
                          setUpvotesPerRound(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPerSong">Max points per song</Label>
                      <Input
                        id="maxPerSong"
                        type="number"
                        min={1}
                        value={maxPointsPerSong}
                        onChange={(e) => setMaxPointsPerSong(e.target.value)}
                        placeholder="No cap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="submissionHours">
                        Submission window (hrs)
                      </Label>
                      <Input
                        id="submissionHours"
                        type="number"
                        min={1}
                        value={submissionDeadlineHours}
                        onChange={(e) =>
                          setSubmissionDeadlineHours(
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="votingHours">Voting window (hrs)</Label>
                      <Input
                        id="votingHours"
                        type="number"
                        min={1}
                        value={votingDeadlineHours}
                        onChange={(e) =>
                          setVotingDeadlineHours(
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="uniqueArtists">Unique artists</Label>
                      <p className="text-xs text-muted-foreground">
                        One song per artist per round
                      </p>
                    </div>
                    <Switch
                      id="uniqueArtists"
                      checked={uniqueArtists}
                      onCheckedChange={setUniqueArtists}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="downvotes">Downvotes</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow negative points
                      </p>
                    </div>
                    <Switch
                      id="downvotes"
                      checked={downvotesEnabled}
                      onCheckedChange={setDownvotesEnabled}
                    />
                  </div>

                  {downvotesEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="downvotesPerRound">
                        Downvote points per round
                      </Label>
                      <Input
                        id="downvotesPerRound"
                        type="number"
                        min={0}
                        value={downvotesPerRound}
                        onChange={(e) =>
                          setDownvotesPerRound(
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Next: Define Rounds
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(routes.leagues())}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={onSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Define your rounds</CardTitle>
                  <CardDescription>
                    Give each round a theme. Rounds open one at a time — the
                    first when the league starts.
                  </CardDescription>
                </CardHeader>
              </Card>

              {roundDrafts.map((draft, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-base">Round {i + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`theme-${i}`}>Theme</Label>
                      <Input
                        id={`theme-${i}`}
                        value={draft.theme}
                        onChange={(e) =>
                          updateDraft(i, { theme: e.target.value })
                        }
                        placeholder="Songs that make you feel invincible"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${i}`}>
                        Description (optional)
                      </Label>
                      <Input
                        id={`desc-${i}`}
                        value={draft.description}
                        onChange={(e) =>
                          updateDraft(i, { description: e.target.value })
                        }
                        placeholder="Any extra guidance for this round"
                      />
                    </div>
                    <details>
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Custom durations
                      </summary>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`sub-${i}`}>Submission (hrs)</Label>
                          <Input
                            id={`sub-${i}`}
                            type="number"
                            min={1}
                            value={draft.submissionDurationHours}
                            onChange={(e) =>
                              updateDraft(i, {
                                submissionDurationHours: e.target.value,
                              })
                            }
                            placeholder={String(submissionDeadlineHours)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vote-${i}`}>Voting (hrs)</Label>
                          <Input
                            id={`vote-${i}`}
                            type="number"
                            min={1}
                            value={draft.votingDurationHours}
                            onChange={(e) =>
                              updateDraft(i, {
                                votingDurationHours: e.target.value,
                              })
                            }
                            placeholder={String(votingDeadlineHours)}
                          />
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating…' : 'Create League'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </PageContainer>
    </>
  )
}

export default NewLeaguePage
