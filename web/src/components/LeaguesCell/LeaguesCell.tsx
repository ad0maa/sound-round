import { Globe, Lock, Music, Plus, Users } from 'lucide-react'
import type { MyLeaguesQuery, MyLeaguesQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'

export const QUERY: TypedDocumentNode<MyLeaguesQuery, MyLeaguesQueryVariables> =
  gql`
    query MyLeaguesQuery {
      myLeagues {
        id
        name
        description
        isPublic
        memberCount
        totalRounds
        myRole
      }
    }
  `

export const Loading = () => (
  <p className="p-6 text-muted-foreground">Loading your leagues…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="p-6 text-destructive">Error: {error?.message}</p>
)

export const Empty = () => (
  <div className="p-6">
    <Card>
      <CardContent className="space-y-3 py-12 text-center">
        <Music className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          No leagues yet — start one and invite your friends, or join a public
          league.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to={routes.newLeague()}>
              <Plus className="h-4 w-4" />
              New League
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={routes.browseLeagues()}>
              <Globe className="h-4 w-4" />
              Browse Leagues
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)

export const Success = ({
  myLeagues,
}: {
  myLeagues: MyLeaguesQuery['myLeagues']
}) => {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {myLeagues.map((league) => (
        <Link key={league.id} to={routes.league({ id: league.id })}>
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{league.name}</CardTitle>
                <div className="flex flex-shrink-0 gap-1">
                  {league.myRole === 'creator' && (
                    <Badge variant="secondary">Creator</Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    {league.isPublic ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {league.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
              {league.description && (
                <CardDescription>{league.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {league.memberCount ?? 0} member
              {league.memberCount === 1 ? '' : 's'}
              <span className="mx-1">·</span>
              {league.totalRounds} rounds
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
