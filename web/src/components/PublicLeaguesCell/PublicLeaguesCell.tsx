import { Globe, Plus, Users } from 'lucide-react'
import type {
  PublicLeaguesQuery,
  PublicLeaguesQueryVariables,
} from 'types/graphql'

import { Link, navigate, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'

export const QUERY: TypedDocumentNode<
  PublicLeaguesQuery,
  PublicLeaguesQueryVariables
> = gql`
  query PublicLeaguesQuery {
    publicLeagues {
      id
      name
      description
      memberCount
      maxPlayers
      totalRounds
      myRole
      hasStarted
      isFinished
      creator {
        displayName
      }
    }
  }
`

export const Loading = () => (
  <p className="p-6 text-muted-foreground">Loading public leagues…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

export const Empty = () => (
  <div className="p-6">
    <Card>
      <CardContent className="space-y-3 py-12 text-center">
        <Globe className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          No public leagues yet — make yours public when you create one.
        </p>
        <Button asChild>
          <Link to={routes.newLeague()}>
            <Plus className="h-4 w-4" />
            New League
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>
)

const JOIN_LEAGUE = gql`
  mutation JoinPublicLeagueMutation($id: String!) {
    joinLeague(id: $id) {
      id
    }
  }
`

export const Success = ({
  publicLeagues,
  isAuthenticated = true,
}: {
  publicLeagues: PublicLeaguesQuery['publicLeagues']
  isAuthenticated?: boolean
}) => {
  const [joinLeague, { loading }] = useMutation(JOIN_LEAGUE, {
    onCompleted: (data) => navigate(routes.league({ id: data.joinLeague.id })),
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {publicLeagues.map((league) => {
        const isMember = league.myRole != null
        const isFull = (league.memberCount ?? 0) >= league.maxPlayers

        return (
          <Card key={league.id} className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{league.name}</CardTitle>
                {league.isFinished ? (
                  <Badge variant="secondary">Finished</Badge>
                ) : league.hasStarted ? (
                  <Badge variant="secondary">In progress</Badge>
                ) : null}
              </div>
              {league.description && (
                <CardDescription>{league.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {league.memberCount ?? 0}/{league.maxPlayers} members
                <span className="mx-1">·</span>
                {league.totalRounds} rounds
              </div>
              <p className="text-xs text-muted-foreground">
                Created by {league.creator.displayName}
              </p>
              {!isAuthenticated ? (
                <Button asChild size="sm" className="w-full">
                  <Link to={routes.login()}>Log in to join</Link>
                </Button>
              ) : isMember ? (
                <Button asChild size="sm" className="w-full">
                  <Link to={routes.league({ id: league.id })}>View League</Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={loading || isFull}
                  onClick={() => joinLeague({ variables: { id: league.id } })}
                >
                  {isFull ? 'Full' : loading ? 'Joining…' : 'Join'}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
