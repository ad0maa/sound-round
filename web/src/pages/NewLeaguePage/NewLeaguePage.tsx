import { useState } from 'react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import {
  DAY_OPTIONS,
  defaultRules,
  type LeagueRulesValues,
  toLeagueRulesInput,
} from 'src/components/LeagueRulesFields/leagueRules'
import LeagueRulesFields from 'src/components/LeagueRulesFields/LeagueRulesFields'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
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
  /** Empty means "use the league default". */
  submissionDays: string
  votingDays: string
}

const emptyRound = (): RoundDraft => ({
  theme: '',
  description: '',
  submissionDays: '',
  votingDays: '',
})

/** Sentinel for "no override" — Radix Select can't hold an empty string value. */
const INHERIT = 'inherit'

const roundDaysToHours = (days: string) =>
  days ? parseInt(days, 10) * 24 : null

type RoundDaySelectProps = {
  id: string
  label: string
  value: string
  defaultDays: number
  onChange: (days: string) => void
}

/** Per-round window override, defaulting to whatever the league is set to. */
const RoundDaySelect = ({
  id,
  label,
  value,
  defaultDays,
  onChange,
}: RoundDaySelectProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Select
      value={value || INHERIT}
      onValueChange={(next) => onChange(next === INHERIT ? '' : next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={INHERIT}>
          League default ({defaultDays} {defaultDays === 1 ? 'day' : 'days'})
        </SelectItem>
        {DAY_OPTIONS.map((days) => (
          <SelectItem key={days} value={String(days)}>
            {days} {days === 1 ? 'day' : 'days'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const NewLeaguePage = () => {
  const [step, setStep] = useState<1 | 2>(1)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [totalRounds, setTotalRounds] = useState('5')
  const [rules, setRules] = useState<LeagueRulesValues>(defaultRules)

  const [roundDrafts, setRoundDrafts] = useState<RoundDraft[]>([emptyRound()])

  const updateRules = (patch: Partial<LeagueRulesValues>) =>
    setRules((prev) => ({ ...prev, ...patch }))

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
    const rounds = parseInt(totalRounds, 10)
    if (Number.isNaN(rounds) || rounds < 1 || rounds > 30) {
      toast.error('Pick between 1 and 30 rounds')
      return
    }
    const built = toLeagueRulesInput(rules)
    if ('error' in built) {
      toast.error(built.error)
      return
    }
    // Resize the drafts array to the round count, keeping anything typed.
    setRoundDrafts((drafts) =>
      Array.from({ length: rounds }, (_, i) => drafts[i] ?? emptyRound())
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
    const built = toLeagueRulesInput(rules)
    if ('error' in built) {
      toast.error(built.error)
      setStep(1)
      return
    }

    createLeague({
      variables: {
        input: {
          ...built.input,
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          rounds: roundDrafts.map((d) => ({
            theme: d.theme.trim(),
            description: d.description.trim() || null,
            submissionDurationHours: roundDaysToHours(d.submissionDays),
            votingDurationHours: roundDaysToHours(d.votingDays),
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
                <CardContent>
                  <LeagueRulesFields
                    values={rules}
                    onChange={updateRules}
                    leadingFields={
                      <div className="space-y-2">
                        <Label htmlFor="totalRounds">Rounds</Label>
                        <Input
                          id="totalRounds"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={30}
                          value={totalRounds}
                          onChange={(e) => setTotalRounds(e.target.value)}
                        />
                      </div>
                    }
                  />
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
                        <RoundDaySelect
                          id={`sub-${i}`}
                          label="Days to submit"
                          value={draft.submissionDays}
                          defaultDays={rules.submissionDays}
                          onChange={(submissionDays) =>
                            updateDraft(i, { submissionDays })
                          }
                        />
                        <RoundDaySelect
                          id={`vote-${i}`}
                          label="Days to vote"
                          value={draft.votingDays}
                          defaultDays={rules.votingDays}
                          onChange={(votingDays) =>
                            updateDraft(i, { votingDays })
                          }
                        />
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
