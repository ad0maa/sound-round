import { useEffect } from 'react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'

import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'

const JOIN_LEAGUE_BY_INVITE = gql`
  mutation JoinLeagueByInviteMutation($inviteCode: String!) {
    joinLeagueByInvite(inviteCode: $inviteCode) {
      id
      name
    }
  }
`

type JoinPageProps = {
  code: string
}

const JoinPage = ({ code }: JoinPageProps) => {
  const [joinLeague, { loading, error, data }] = useMutation(
    JOIN_LEAGUE_BY_INVITE,
    {
      onCompleted: (result) => {
        setTimeout(
          () => navigate(routes.league({ id: result.joinLeagueByInvite.id })),
          1200
        )
      },
    }
  )

  useEffect(() => {
    joinLeague({ variables: { inviteCode: code } })
  }, [code, joinLeague])

  const alreadyMember = error?.message.includes('Already a member')

  return (
    <>
      <Metadata title="Join League" />
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 py-12 text-center">
            {loading && (
              <p className="text-muted-foreground">Joining league…</p>
            )}

            {data && (
              <>
                <p className="text-xl font-bold">You&apos;re in! 🎉</p>
                <p className="text-muted-foreground">
                  Welcome to {data.joinLeagueByInvite.name}. Redirecting…
                </p>
              </>
            )}

            {error && !alreadyMember && (
              <>
                <p className="text-xl font-bold">Couldn&apos;t join</p>
                <p className="text-sm text-destructive">{error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => navigate(routes.leagues())}
                >
                  Go to My Leagues
                </Button>
              </>
            )}

            {alreadyMember && (
              <>
                <p className="text-xl font-bold">You&apos;re already in!</p>
                <Button onClick={() => navigate(routes.leagues())}>
                  Go to My Leagues
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default JoinPage
