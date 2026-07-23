import { ArrowLeft, LogOut } from 'lucide-react'

import { Link, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'

import { useAuth } from 'src/auth'
import PageContainer from 'src/components/PageContainer/PageContainer'
import ThemeSwitcher from 'src/components/ThemeSwitcher/ThemeSwitcher'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'

const SettingsPage = () => {
  const { currentUser, logOut } = useAuth()

  const displayName = (currentUser?.displayName as string) ?? ''
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <Metadata title="Settings" description="Your SoundRound preferences" />

      <PageContainer wide={false}>
        <Button asChild variant="ghost" className="mb-3.5 -ml-1">
          <Link to={routes.leagues()}>
            <ArrowLeft className="h-4 w-4" />
            Back to leagues
          </Link>
        </Button>

        <h1 className="mb-5 text-[38px]">Settings</h1>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
              Appearance
            </div>
            <p className="text-sm text-muted-foreground">
              Pick an accent — it applies everywhere, on this device.
            </p>
            <ThemeSwitcher showLabels className="mt-1" />
          </Card>

          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
              Account
            </div>
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="text-base">
                  {initials || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-semibold">{displayName}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {(currentUser?.email as string) ?? ''}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-fit text-destructive"
              onClick={() => logOut()}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}

export default SettingsPage
