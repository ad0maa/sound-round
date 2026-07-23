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
import { Card } from 'src/components/ui/card'

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
  <p className="px-4 text-muted-foreground nav:px-10">
    Loading public leagues…
  </p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="px-4 text-destructive nav:px-10">Error: {error?.message}</p>
)

export const Empty = () => (
  <div className="px-4 nav:px-10">
    <Card className="items-center gap-3 py-12 text-center">
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
    <div className="grid grid-cols-1 gap-[18px] px-4 nav:grid-cols-3 nav:px-10">
      {publicLeagues.map((league) => {
        const isMember = league.myRole != null
        const isFull = (league.memberCount ?? 0) >= league.maxPlayers

        return (
          <Card key={league.id} className="h-full">
            <div className="flex items-start gap-2">
              <span className="flex-1 font-heading text-[18px] leading-tight">
                {league.name}
              </span>
              {league.isFinished ? (
                <Badge variant="secondary">Finished</Badge>
              ) : league.hasStarted ? (
                <Badge variant="secondary">In progress</Badge>
              ) : null}
            </div>
            {league.description && (
              <p className="text-[13px] text-muted-foreground">
                {league.description}
              </p>
            )}
            <div className="mt-auto flex flex-col gap-2.5 pt-1">
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
            </div>
          </Card>
        )
      })}
    </div>
  )
}
