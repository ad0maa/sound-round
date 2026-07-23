import { useState } from 'react'

import { ArrowLeft, LogOut, Mail, Moon, Sun } from 'lucide-react'

import { Link, routes } from '@cedarjs/router'
import { Metadata, useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import PageContainer from 'src/components/PageContainer/PageContainer'
import ThemeSwitcher from 'src/components/ThemeSwitcher/ThemeSwitcher'
import { Avatar, AvatarFallback } from 'src/components/ui/avatar'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { useTheme } from 'src/lib/theme'
import { cn } from 'src/lib/utils'

const UPDATE_PROFILE = gql`
  mutation UpdateProfileMutation($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      displayName
    }
  }
`

const SettingsPage = () => {
  const { currentUser, reauthenticate, forgotPassword, logOut } = useAuth()
  const { mode, setMode } = useTheme()

  const email = (currentUser?.email as string) ?? ''
  const [displayName, setDisplayName] = useState(
    (currentUser?.displayName as string) ?? ''
  )
  const [sendingReset, setSendingReset] = useState(false)

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const [updateProfile, { loading: savingName }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async () => {
      await reauthenticate()
      toast.success('Display name updated')
    },
    onError: (error) => toast.error(error.message),
  })

  const nameChanged = displayName.trim() !== (currentUser?.displayName ?? '')

  const onSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }
    updateProfile({ variables: { input: { displayName: displayName.trim() } } })
  }

  const onSendResetEmail = async () => {
    setSendingReset(true)
    try {
      const response = await forgotPassword(email)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`Password reset link sent to ${email}`)
      }
    } finally {
      setSendingReset(false)
    }
  }

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
              Account
            </div>
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="text-base">
                  {initials || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm text-muted-foreground">
                {email}
              </div>
            </div>

            <form onSubmit={onSaveName} className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                />
                <Button type="submit" disabled={!nameChanged || savingName}>
                  {savingName ? 'Saving…' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Shown to other members — must be unique across SoundRound.
              </p>
            </form>

            <Button
              variant="secondary"
              className="w-fit text-destructive"
              onClick={() => {
                if (window.confirm('Log out of SoundRound?')) logOut()
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </Card>

          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
              Password
            </div>
            <p className="text-sm text-muted-foreground">
              We&apos;ll email a reset link to {email || 'your address'}.
            </p>
            <Button
              variant="secondary"
              className="w-fit"
              disabled={sendingReset || !email}
              onClick={onSendResetEmail}
            >
              <Mail className="h-4 w-4" />
              {sendingReset ? 'Sending…' : 'Send password reset email'}
            </Button>
          </Card>

          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
              Appearance
            </div>
            <p className="text-sm text-muted-foreground">
              Light, dark, or an accent — all apply everywhere, on this device.
            </p>

            <div className="inline-flex w-fit overflow-hidden rounded-full border border-divider">
              {(
                [
                  { id: 'light' as const, label: 'Light', icon: Sun },
                  { id: 'dark' as const, label: 'Dark', icon: Moon },
                ] satisfies {
                  id: 'light' | 'dark'
                  label: string
                  icon: typeof Sun
                }[]
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => setMode(id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-colors',
                    mode === id
                      ? 'bg-brand text-white'
                      : 'hover:bg-foreground/[0.06]'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <ThemeSwitcher showLabels className="mt-1" />
          </Card>
        </div>
      </PageContainer>
    </>
  )
}

export default SettingsPage
