import { useState } from 'react'

import { Trophy } from 'lucide-react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

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

const NewLeaguePage = () => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [upvotesPerRound, setUpvotesPerRound] = useState(10)
  const [downvotesEnabled, setDownvotesEnabled] = useState(false)
  const [downvotesPerRound, setDownvotesPerRound] = useState(0)
  const [maxPointsPerSong, setMaxPointsPerSong] = useState('')
  const [uniqueArtists, setUniqueArtists] = useState(false)
  const [totalRounds, setTotalRounds] = useState(10)
  const [maxPlayers, setMaxPlayers] = useState(20)

  const [createLeague, { loading }] = useMutation(CREATE_LEAGUE, {
    onCompleted: (data) => {
      toast.success('League created!')
      navigate(routes.league({ id: data.createLeague.id }))
    },
    onError: (error) => toast.error(error.message),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('League name is required')
      return
    }
    createLeague({
      variables: {
        input: {
          name: name.trim(),
          description: description.trim() || null,
          upvotesPerRound,
          downvotesEnabled,
          downvotesPerRound: downvotesEnabled ? downvotesPerRound : 0,
          maxPointsPerSong: maxPointsPerSong
            ? parseInt(maxPointsPerSong, 10)
            : null,
          uniqueArtists,
          totalRounds,
          maxPlayers,
        },
      },
    })
  }

  return (
    <>
      <Metadata title="New League" />
      <PageHeader title="New League" icon={Trophy} />

      <div className="mx-auto w-full max-w-lg space-y-6 p-6">
        <form onSubmit={onSubmit} className="space-y-6">
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
                    value={totalRounds}
                    onChange={(e) =>
                      setTotalRounds(parseInt(e.target.value, 10) || 1)
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
                      setDownvotesPerRound(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create League'}
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
      </div>
    </>
  )
}

export default NewLeaguePage
