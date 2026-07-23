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
  const [submissionDurationHours, setSubmissionDurationHours] = useState('')
  const [votingDurationHours, setVotingDurationHours] = useState('')

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
          submissionDurationHours: submissionDurationHours
            ? parseInt(submissionDurationHours, 10)
            : null,
          votingDurationHours: votingDurationHours
            ? parseInt(votingDurationHours, 10)
            : null,
        },
      },
    })
  }

  return (
    <>
      <Metadata title="New Round" />

      <PageContainer className="max-w-lg" wide={false}>
        <PageHeader title="New Round" description="Give it a theme." />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionHours">Submission (hrs)</Label>
                  <Input
                    id="submissionHours"
                    type="number"
                    min={1}
                    value={submissionDurationHours}
                    onChange={(e) => setSubmissionDurationHours(e.target.value)}
                    placeholder="League default"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="votingHours">Voting (hrs)</Label>
                  <Input
                    id="votingHours"
                    type="number"
                    min={1}
                    value={votingDurationHours}
                    onChange={(e) => setVotingDurationHours(e.target.value)}
                    placeholder="League default"
                  />
                </div>
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
      </PageContainer>
    </>
  )
}

export default NewRoundPage
