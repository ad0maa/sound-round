import { Music, Trophy, LogOut, Plus } from 'lucide-react'

import { Link, routes, useLocation } from '@cedarjs/router'
import { Toaster } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Separator } from 'src/components/ui/separator'

type AppLayoutProps = {
  children?: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { currentUser, logOut } = useAuth()
  const { pathname } = useLocation()

  const displayName = (currentUser?.displayName as string) ?? ''
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isDemo = Boolean(currentUser?.isDemo)
  const demoExpiresAt = currentUser?.demoExpiresAt
    ? new Date(currentUser.demoExpiresAt)
    : null
  const demoMinutesLeft = demoExpiresAt
    ? Math.max(0, Math.round((demoExpiresAt.getTime() - Date.now()) / 60000))
    : null

  const navItem = (
    to: string,
    label: string,
    Icon: typeof Music,
    active: boolean
  ) => (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className="justify-start gap-2 hover:bg-primary/10 hover:text-primary"
      asChild
    >
      <Link to={to}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Toaster toastOptions={{ duration: 5000 }} />

      {isDemo && (
        <div className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 text-sm text-primary">
          <Badge variant="secondary">Demo Mode</Badge>
          <span>
            You&apos;re exploring with a temporary account — your data clears
            automatically
            {demoMinutesLeft !== null && demoMinutesLeft > 0
              ? ` in about ${demoMinutesLeft} minute${demoMinutesLeft === 1 ? '' : 's'}.`
              : ' soon.'}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="flex w-full flex-col border-r border-border bg-card md:w-64">
          <div className="flex h-14 items-center border-b px-4">
            <Link
              to={routes.leagues()}
              className="flex items-center gap-2 font-semibold"
            >
              <Music className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text font-bold text-transparent">
                SoundRound
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-2 p-4">
            {navItem(
              routes.leagues(),
              'My Leagues',
              Trophy,
              pathname === routes.leagues()
            )}
            {navItem(
              routes.newLeague(),
              'New League',
              Plus,
              pathname === routes.newLeague()
            )}
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => logOut()}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>

          <div className="mt-auto p-4">
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {(currentUser?.email as string) ?? ''}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
