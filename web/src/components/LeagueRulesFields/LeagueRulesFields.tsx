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
import { cn } from 'src/lib/utils'

import { DAY_OPTIONS, type LeagueRulesValues, type Pacing } from './leagueRules'

/**
 * The scoring + pacing half of the league form. Shared by the new-league wizard
 * and League Settings so the two can't drift apart.
 */

const PACING_OPTIONS: {
  value: Pacing
  label: string
  summary: string
}[] = [
  {
    value: 'chill',
    label: 'Chill',
    summary:
      'Deadlines never move. Playlists and results drop right on schedule, even when everyone finishes early — best if you want a predictable rhythm.',
  },
  {
    value: 'fast',
    label: 'Fast',
    summary:
      'Playlists and results appear as soon as everyone’s done, but the next round still starts at its scheduled time — quick feedback without the schedule drifting.',
  },
  {
    value: 'fastest',
    label: 'Fastest',
    summary:
      'Every phase starts the moment everyone finishes, and the deadlines shift along with it — best if you just want the music to keep rolling.',
  },
]

type DaySelectProps = {
  id: string
  label: string
  value: number
  onChange: (days: number) => void
}

const DaySelect = ({ id, label, value, onChange }: DaySelectProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(parseInt(next, 10))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DAY_OPTIONS.map((days) => (
          <SelectItem key={days} value={String(days)}>
            {days} {days === 1 ? 'day' : 'days'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

type NumberFieldProps = {
  id: string
  label: string
  value: string
  onChange: (raw: string) => void
  min?: number
  placeholder?: string
}

/**
 * Uncoerced number input: the raw string stays in state so the field can be
 * emptied mid-edit. Callers parse on submit.
 */
const NumberField = ({
  id,
  label,
  value,
  onChange,
  min = 1,
  placeholder,
}: NumberFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
)

type LeagueRulesFieldsProps = {
  values: LeagueRulesValues
  onChange: (patch: Partial<LeagueRulesValues>) => void
  /** Extra fields rendered alongside max players (the wizard adds Rounds). */
  leadingFields?: React.ReactNode
}

const LeagueRulesFields = ({
  values,
  onChange,
  leadingFields,
}: LeagueRulesFieldsProps) => {
  const selectedPacing = PACING_OPTIONS.find((p) => p.value === values.pacing)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {leadingFields}
        <NumberField
          id="maxPlayers"
          label="Max players"
          min={2}
          value={values.maxPlayers}
          onChange={(maxPlayers) => onChange({ maxPlayers })}
        />
        <NumberField
          id="upvotes"
          label="Upvote points per round"
          value={values.upvotesPerRound}
          onChange={(upvotesPerRound) => onChange({ upvotesPerRound })}
        />
        <NumberField
          id="maxPerSong"
          label="Max points per song"
          value={values.maxPointsPerSong}
          onChange={(maxPointsPerSong) => onChange({ maxPointsPerSong })}
          placeholder="Same as per round"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Voters can’t vote on their own song, so with only a few players the
        per-song cap decides what’s spendable — everyone is allocated whichever
        of the two totals is smaller.
      </p>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="uniqueArtists">Unique artists</Label>
          <p className="text-xs text-muted-foreground">
            One song per artist per round
          </p>
        </div>
        <Switch
          id="uniqueArtists"
          checked={values.uniqueArtists}
          onCheckedChange={(uniqueArtists) => onChange({ uniqueArtists })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="downvotes">Downvotes</Label>
            <p className="text-xs text-muted-foreground">
              Let voters spend points against tracks
            </p>
          </div>
          <Switch
            id="downvotes"
            checked={values.downvotesEnabled}
            onCheckedChange={(downvotesEnabled) =>
              onChange({ downvotesEnabled })
            }
          />
        </div>

        {values.downvotesEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              id="downvotesPerRound"
              label="Downvote points per round"
              value={values.downvotesPerRound}
              onChange={(downvotesPerRound) => onChange({ downvotesPerRound })}
            />
            <NumberField
              id="maxDownvotesPerSong"
              label="Max downvotes per song"
              value={values.maxDownvotesPerSong}
              onChange={(maxDownvotesPerSong) =>
                onChange({ maxDownvotesPerSong })
              }
              placeholder="Same as per round"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Pacing</Label>
          <p className="text-xs text-muted-foreground">
            What happens when everyone finishes submitting or voting early.
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {PACING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={values.pacing === option.value}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                values.pacing === option.value
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onChange({ pacing: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        {selectedPacing && (
          <p className="rounded-xl border border-divider px-3.5 py-3 text-[13px] text-muted-foreground">
            {selectedPacing.summary}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <DaySelect
            id="submissionDays"
            label="Days to submit"
            value={values.submissionDays}
            onChange={(submissionDays) => onChange({ submissionDays })}
          />
          <DaySelect
            id="votingDays"
            label="Days to vote"
            value={values.votingDays}
            onChange={(votingDays) => onChange({ votingDays })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Applies to rounds that haven’t started yet. Leave enough time for
          everyone to listen through the playlist.
        </p>
      </div>
    </div>
  )
}

export default LeagueRulesFields
