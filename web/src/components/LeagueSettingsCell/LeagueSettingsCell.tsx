import { useState } from 'react'

import { ArrowLeft, Check, Copy, RefreshCw, ShieldX } from 'lucide-react'
import type {
  FindLeagueSettingsQuery,
  FindLeagueSettingsQueryVariables,
} from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import PageContainer from 'src/components/PageContainer/PageContainer'
import PageHeader from 'src/components/PageHeader/PageHeader'
import { Badge } from 'src/components/ui/badge'
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

export const QUERY: TypedDocumentNode<
  FindLeagueSettingsQuery,
  FindLeagueSettingsQueryVariables
> = gql`
  query FindLeagueSettingsQuery($id: String!) {
    league(id: $id) {
      id
      name
      description
      isPublic
      inviteCode
      maxPlayers
      upvotesPerRound
      downvotesEnabled
      downvotesPerRound
      maxPointsPerSong
      uniqueArtists
      submissionDeadlineHours
      votingDeadlineHours
      myRole
      hasStarted
      members {
        userId
        role
        joinedAt
        user {
          displayName
        }
      }
    }
  }
`

const UPDATE_LEAGUE = gql`
  mutation UpdateLeagueMutation($id: String!, $input: UpdateLeagueInput!) {
    updateLeague(id: $id, input: $input) {
      id
    }
  }
`

const REMOVE_MEMBER = gql`
  mutation RemoveMemberMutation($leagueId: String!, $userId: String!) {
    removeMember(leagueId: $leagueId, userId: $userId)
  }
`

const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRoleMutation(
    $leagueId: String!
    $userId: String!
    $role: Role!
  ) {
    updateMemberRole(leagueId: $leagueId, userId: $userId, role: $role) {
      leagueId
      userId
      role
    }
  }
`

const ROTATE_INVITE_CODE = gql`
  mutation RotateInviteCodeMutation($id: String!) {
    rotateInviteCode(id: $id) {
      id
      inviteCode
    }
  }
`

export const Loading = () => (
  <PageContainer>
    <p className="text-muted-foreground">Loading league settings…</p>
  </PageContainer>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <PageContainer>
    <p className="text-destructive">Error: {error?.message}</p>
  </PageContainer>
)

type CellProps = FindLeagueSettingsQuery & FindLeagueSettingsQueryVariables

export const Success = ({ league }: CellProps) => {
  const { currentUser } = useAuth()
  const canManage = league.myRole === 'creator' || league.myRole === 'admin'
  const isCreator = league.myRole === 'creator'

  const [name, setName] = useState(league.name)
  const [description, setDescription] = useState(league.description ?? '')
  const [isPublic, setIsPublic] = useState(league.isPublic)
  const [maxPlayers, setMaxPlayers] = useState(league.maxPlayers)
  const [upvotesPerRound, setUpvotesPerRound] = useState(league.upvotesPerRound)
  const [downvotesEnabled, setDownvotesEnabled] = useState(
    league.downvotesEnabled
  )
  const [downvotesPerRound, setDownvotesPerRound] = useState(
    league.downvotesPerRound
  )
  const [maxPointsPerSong, setMaxPointsPerSong] = useState(
    league.maxPointsPerSong != null ? String(league.maxPointsPerSong) : ''
  )
  const [uniqueArtists, setUniqueArtists] = useState(league.uniqueArtists)
  const [submissionDeadlineHours, setSubmissionDeadlineHours] = useState(
    league.submissionDeadlineHours
  )
  const [votingDeadlineHours, setVotingDeadlineHours] = useState(
    league.votingDeadlineHours
  )
  const [copied, setCopied] = useState(false)

  const refetch = {
    refetchQueries: [{ query: QUERY, variables: { id: league.id } }],
  }

  const [updateLeague, { loading: saving }] = useMutation(UPDATE_LEAGUE, {
    onCompleted: () => toast.success('League updated'),
    onError: (error) => toast.error(error.message),
    ...refetch,
  })
  const [removeMember] = useMutation(REMOVE_MEMBER, {
    onCompleted: () => toast.success('Member removed'),
    onError: (error) => toast.error(error.message),
    ...refetch,
  })
  const [updateMemberRole] = useMutation(UPDATE_MEMBER_ROLE, {
    onCompleted: () => toast.success('Role updated'),
    onError: (error) => toast.error(error.message),
    ...refetch,
  })
  const [rotateInviteCode] = useMutation(ROTATE_INVITE_CODE, {
    onCompleted: () => toast.success('New invite link generated'),
    onError: (error) => toast.error(error.message),
    ...refetch,
  })

  if (!canManage) {
    return (
      <PageContainer wide={false}>
        <Card className="items-center gap-4 py-8 text-center">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Only the league creator or an admin can manage settings.
          </p>
          <Button asChild variant="secondary">
            <Link to={routes.league({ id: league.id })}>Back to league</Link>
          </Button>
        </Card>
      </PageContainer>
    )
  }

  const inviteLink = league.inviteCode
    ? `${window.location.origin}/join/${league.inviteCode}`
    : null

  const copyInviteLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onRotate = () => {
    if (
      window.confirm(
        'Generate a new invite link? The current link will stop working.'
      )
    ) {
      rotateInviteCode({ variables: { id: league.id } })
    }
  }

  const onKick = (userId: string, displayName: string) => {
    if (window.confirm(`Remove ${displayName} from the league?`)) {
      removeMember({ variables: { leagueId: league.id, userId } })
    }
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('League name is required')
      return
    }
    updateLeague({
      variables: {
        id: league.id,
        input: {
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
          maxPlayers,
          upvotesPerRound,
          downvotesEnabled,
          downvotesPerRound: downvotesEnabled ? downvotesPerRound : 0,
          maxPointsPerSong: maxPointsPerSong
            ? parseInt(maxPointsPerSong, 10)
            : null,
          uniqueArtists,
          submissionDeadlineHours,
          votingDeadlineHours,
        },
      },
    })
  }

  return (
    <PageContainer className="max-w-lg" wide={false}>
      <Button asChild variant="ghost" className="mb-3.5 -ml-1">
        <Link to={routes.league({ id: league.id })}>
          <ArrowLeft className="h-4 w-4" />
          Back to league
        </Link>
      </Button>

      <PageHeader
        title="League Settings"
        description={`Manage ${league.name}.`}
      />

      <div className="space-y-6">
        <form onSubmit={onSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
              {league.hasStarted && (
                <CardDescription className="text-destructive">
                  The league is underway — changing scoring rules mid-season
                  affects fairness. Tread carefully.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      setVotingDeadlineHours(parseInt(e.target.value, 10) || 1)
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
                      setDownvotesPerRound(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Invite link</CardTitle>
            <CardDescription>
              Anyone with this link can join. Generate a new one if it leaks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inviteLink && (
              <p className="truncate rounded-xl border border-divider bg-background px-3 py-2 font-mono text-[13px] text-muted-foreground dark:bg-card">
                {inviteLink}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={copyInviteLink}
                disabled={!inviteLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
              <Button type="button" variant="outline" onClick={onRotate}>
                <RefreshCw className="h-4 w-4" />
                New link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {isCreator
                ? 'Promote trusted players to admin, or remove members.'
                : 'Admins can remove players; only the creator manages roles.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {league.members.map((member) => {
              const isSelf = member.userId === currentUser?.id
              const canKick =
                !isSelf &&
                member.role !== 'creator' &&
                (isCreator || member.role !== 'admin')

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {member.user.displayName}
                      {isSelf && (
                        <span className="text-muted-foreground"> · you</span>
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={member.role === 'player' ? 'outline' : 'default'}
                  >
                    {member.role}
                  </Badge>
                  {isCreator && !isSelf && member.role !== 'creator' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMemberRole({
                          variables: {
                            leagueId: league.id,
                            userId: member.userId,
                            role: member.role === 'admin' ? 'player' : 'admin',
                          },
                        })
                      }
                    >
                      {member.role === 'admin' ? 'Demote' : 'Make admin'}
                    </Button>
                  )}
                  {canKick && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        onKick(member.userId, member.user.displayName)
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
