import { useEffect, useState } from 'react'

import { Music, Sparkles } from 'lucide-react'

import { Link, navigate, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'
import { toast, Toaster } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import PublicLeaguesCell from 'src/components/PublicLeaguesCell'
import { Badge } from 'src/components/ui/badge'
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
        <header className="flex items-center justify-between px-5 py-5 nav:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-brand-600 text-white">
              <Music className="h-1/2 w-1/2" strokeWidth={2.75} />
            </span>
            <span className="font-heading text-[20px]">SoundRound</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={routes.login()}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Log in
            </Link>
            <Link
              to={routes.signup()}
              className={buttonVariants({ variant: 'default' })}
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="flex flex-col items-center gap-5 px-6 py-16 text-center animate-fade-in">
          <Badge variant="secondary">A music league with your friends</Badge>
          <h1 className="max-w-[14ch] text-[42px] leading-[1.05] nav:text-[64px]">
            Every week, a new theme. Everyone brings a song.
          </h1>
          <p className="max-w-[52ch] text-lg text-muted-foreground">
            Submit tracks, vote on your favourites, and crown a champion every
            round. It&apos;s the group chat argument, settled properly.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={onTryDemo} disabled={isStartingDemo}>
              <Sparkles className="h-4 w-4" />
              {isStartingDemo
                ? 'Setting up your demo…'
                : 'Try the demo — no account'}
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#public-leagues">Browse public leagues</a>
            </Button>
          </div>
        </section>

        <section id="public-leagues" className="flex-1 bg-card/60 pb-10 pt-8">
          <div className="mx-auto w-full max-w-[960px] px-5 nav:px-10">
            <h2 className="text-[24px]">Browse public leagues</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              See what&apos;s already live — log in or try the demo to join.
            </p>
            <PublicLeaguesCell isAuthenticated={false} />
          </div>
        </section>
      </main>
    </>
  )
}

export default HomePage
