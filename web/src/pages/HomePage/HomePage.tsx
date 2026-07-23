import { useEffect, useState } from 'react'

import { Music, Sparkles } from 'lucide-react'

import { Link, navigate, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'
import { toast, Toaster } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import PublicLeaguesCell from 'src/components/PublicLeaguesCell'
import { Button, buttonVariants } from 'src/components/ui/button'

const HomePage = () => {
  const { isAuthenticated, signUp } = useAuth()
  const [isStartingDemo, setIsStartingDemo] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.leagues(), { replace: true })
    }
  }, [isAuthenticated])

  const onTryDemo = async () => {
    setIsStartingDemo(true)
    try {
      // Throwaway, invisible credentials — the visitor never sees these.
      // The server marks the account as a demo user and expires it later.
      const id = crypto.randomUUID()
      const response = await signUp({
        username: `demo-${id}@demo.soundround.local`,
        password: crypto.randomUUID(),
        isDemo: true,
      })

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("You're in! Feel free to click around.")
      }
    } finally {
      setIsStartingDemo(false)
    }
  }

  if (isAuthenticated) {
    return <Metadata title="Home" description="Music league with friends" />
  }

  return (
    <>
      <Metadata title="SoundRound" description="Music league with friends" />
      <Toaster toastOptions={{ duration: 6000 }} />

      <main className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-lg font-bold text-transparent">
              SoundRound
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={routes.login()}
              className={buttonVariants({ variant: 'ghost' })}
            >
              Log in
            </Link>
            <Link
              to={routes.signup()}
              className={buttonVariants({ variant: 'outline' })}
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Music leagues with friends
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Submit songs, vote on your favorites, and crown a winner every
            round.
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={onTryDemo}
            disabled={isStartingDemo}
          >
            <Sparkles className="h-4 w-4" />
            {isStartingDemo
              ? 'Setting up your demo…'
              : 'Try the demo — no account needed'}
          </Button>
        </section>

        <section className="flex-1 border-t">
          <div className="px-4 pt-6 md:px-6">
            <h2 className="text-lg font-semibold">Browse public leagues</h2>
            <p className="text-sm text-muted-foreground">
              See what&apos;s already live — log in or try the demo to join.
            </p>
          </div>
          <PublicLeaguesCell isAuthenticated={false} />
        </section>
      </main>
    </>
  )
}

export default HomePage
