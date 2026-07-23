import { Globe, LogOut, Music, Plus, Trophy } from 'lucide-react'

import { Link, routes, useLocation } from '@cedarjs/router'
import { Toaster } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import ThemeSwitcher from 'src/components/ThemeSwitcher/ThemeSwitcher'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { cn } from 'src/lib/utils'

type AppLayoutProps = {
  children?: React.ReactNode
}

const Brand = ({ size = 34 }: { size?: number }) => (
  <span
    className="grid flex-none place-items-center rounded-full bg-brand-600 text-white"
    style={{ width: size, height: size }}
  >
    <Music className="h-1/2 w-1/2" strokeWidth={2.75} />
  </span>
)

const AppLayout = ({ children }: AppLayoutProps) => {
  const { currentUser, logOut } = useAuth()
  const { pathname } = useLocation()

  const navItems = [
    { to: routes.leagues(), label: 'My Leagues', icon: Trophy },
    { to: routes.newLeague(), label: 'New League', icon: Plus },
    { to: routes.browseLeagues(), label: 'Browse', icon: Globe },
  ]

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

  return (
    <div className="min-h-screen bg-background">
      <Toaster toastOptions={{ duration: 5000 }} />

      {isDemo && (
        <div className="flex items-center justify-center gap-2 bg-brand-100 px-4 py-2 text-sm text-brand-800">
          <Badge>Demo Mode</Badge>
          <span>
            You&apos;re exploring with a temporary account — your data clears
            automatically
            {demoMinutesLeft !== null && demoMinutesLeft > 0
              ? ` in about ${demoMinutesLeft} minute${demoMinutesLeft === 1 ? '' : 's'}.`
              : ' soon.'}
          </span>
        </div>
      )}

      <div className="flex min-h-screen flex-col nav:flex-row">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[244px] flex-none flex-col gap-1 bg-card p-4 nav:flex">
          <Link
            to={routes.leagues()}
            className="mb-3 flex items-center gap-2.5 px-2 py-1.5"
          >
            <Brand />
            <span className="font-heading text-lg">SoundRound</span>
          </Link>

          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 font-heading text-[15px] transition-colors',
                  active
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-foreground hover:bg-foreground/[0.06]'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                {label}
              </Link>
            )
          })}

          <div className="mt-auto flex flex-col gap-3">
            <div className="rounded-2xl bg-background p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Accent
              </div>
              <ThemeSwitcher />
            </div>

            <div className="flex items-center gap-2.5 px-2 py-1">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-[13px]">
                  {initials || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-semibold">
                  {displayName}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {(currentUser?.email as string) ?? ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logOut()}
                title="Log out"
                aria-label="Log out"
                className="ml-auto grid size-8 flex-none place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-2.5 bg-card px-4 py-3 nav:hidden">
          <Brand size={30} />
          <span className="font-heading text-base">SoundRound</span>
          <ThemeSwitcher swatchSize={20} className="ml-auto gap-1.5" />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-20 nav:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-divider bg-card px-1.5 pt-2 nav:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold',
                active ? 'text-brand' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default AppLayout
