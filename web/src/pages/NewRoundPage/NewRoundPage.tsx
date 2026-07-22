import { useState } from 'react'

import { Disc3 } from 'lucide-react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import PageHeader from 'src/components/PageHeader/PageHeader'
import { Button } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'

const CREATE_ROUND = gql`
  mutation CreateRoundMutation($input: CreateRoundInput!) {
    createRound(input: $input) {
      id
      leagueId
    }
  }
`

type NewRoundPageProps = {
  id: string
}

const NewRoundPage = ({ id }: NewRoundPageProps) => {
  const [theme, setTheme] = useState('')
  const [description, setDescription] = useState('')
  const [songsPerPlayer, setSongsPerPlayer] = useState(1)

  const [createRound, { loading }] = useMutation(CREATE_ROUND, {
    onCompleted: (data) => {
      toast.success('Round created!')
      navigate(routes.round({ id, roundId: data.createRound.id }))
    },
    onError: (error) => toast.error(error.message),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) {
      toast.error('Theme is required')
      return
    }
    createRound({
      variables: {
        input: {
          leagueId: id,
          theme: theme.trim(),
          description: description.trim() || null,
          songsPerPlayer,
        },
      },
    })
  }

  return (
    <>
      <Metadata title="New Round" />
      <PageHeader title="New Round" icon={Disc3} />

      <div className="mx-auto w-full max-w-lg space-y-6 p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Round details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Songs that make you feel invincible"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- navigating to this page is itself a deliberate action to create a round
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional extra guidance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="songsPerPlayer">Songs per player</Label>
                <Input
                  id="songsPerPlayer"
                  type="number"
                  min={1}
                  max={5}
                  value={songsPerPlayer}
                  onChange={(e) =>
                    setSongsPerPlayer(parseInt(e.target.value, 10) || 1)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create Round'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(routes.league({ id }))}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export default NewRoundPage
