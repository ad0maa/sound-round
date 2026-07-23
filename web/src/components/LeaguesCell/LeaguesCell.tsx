import { Globe, Lock, Music, Plus } from 'lucide-react'
import type { MyLeaguesQuery, MyLeaguesQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'

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
  <p className="text-muted-foreground">Loading your leagues…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="text-destructive">Error: {error?.message}</p>
)

export const Empty = () => (
  <Card className="items-center gap-3 py-12 text-center">
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
      <Button asChild variant="secondary">
        <Link to={routes.browseLeagues()}>
          <Globe className="h-4 w-4" />
          Browse Leagues
        </Link>
      </Button>
    </div>
  </Card>
)

export const Success = ({
  myLeagues,
}: {
  myLeagues: MyLeaguesQuery['myLeagues']
}) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[18px]">
      {myLeagues.map((league) => (
        <Link key={league.id} to={routes.league({ id: league.id })}>
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
            <div className="flex items-start gap-2">
              <span className="flex-1 font-heading text-[20px] leading-tight">
                {league.name}
              </span>
              <Badge
                variant={league.myRole === 'creator' ? 'default' : 'outline'}
              >
                {league.myRole === 'creator' ? 'Host' : 'Player'}
              </Badge>
            </div>
            {league.description && (
              <p className="text-[13px] text-muted-foreground">
                {league.description}
              </p>
            )}
            <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
              <span>
                {league.memberCount ?? 0} member
                {league.memberCount === 1 ? '' : 's'}
              </span>
              <span>·</span>
              <span>{league.totalRounds} rounds</span>
              <Badge variant="secondary" className="ml-auto gap-1">
                {league.isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {league.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
