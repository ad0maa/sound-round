import { useEffect, useRef } from 'react'

import { Music } from 'lucide-react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  FieldError,
  Submit,
} from '@cedarjs/forms'
import { Link, navigate, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'
import { toast, Toaster } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import { buttonVariants } from 'src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import {
  fieldErrorClassName,
  inputClassName,
  inputErrorClassName,
  labelClassName,
  labelErrorClassName,
} from 'src/lib/formStyles'

const SignupPage = () => {
  const { isAuthenticated, signUp } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  // focus on email box on page load
  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await signUp({
      username: data.username,
      password: data.password,
      displayName: data.displayName,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      // user is signed in automatically
      toast.success('Welcome!')
    }
  }

  return (
    <>
      <Metadata title="Signup" />

      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Toaster toastOptions={{ duration: 6000 }} />
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-brand-600 text-white">
              <Music className="h-1/2 w-1/2" strokeWidth={2.75} />
            </span>
            <span className="font-heading text-2xl">SoundRound</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Start a league, invite your friends, share great music.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    name="username"
                    className={labelClassName}
                    errorClassName={labelErrorClassName}
                  >
                    Email
                  </Label>
                  <TextField
                    name="username"
                    className={inputClassName}
                    errorClassName={inputErrorClassName}
                    ref={usernameRef}
                    validation={{
                      required: { value: true, message: 'Email is required' },
                    }}
                  />
                  <FieldError name="username" className={fieldErrorClassName} />
                </div>

                <div className="space-y-2">
                  <Label
                    name="displayName"
                    className={labelClassName}
                    errorClassName={labelErrorClassName}
                  >
                    Display Name
                  </Label>
                  <TextField
                    name="displayName"
                    className={inputClassName}
                    errorClassName={inputErrorClassName}
                    validation={{
                      required: {
                        value: true,
                        message: 'Display name is required',
                      },
                    }}
                  />
                  <FieldError
                    name="displayName"
                    className={fieldErrorClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    name="password"
                    className={labelClassName}
                    errorClassName={labelErrorClassName}
                  >
                    Password
                  </Label>
                  <PasswordField
                    name="password"
                    className={inputClassName}
                    errorClassName={inputErrorClassName}
                    autoComplete="current-password"
                    validation={{
                      required: {
                        value: true,
                        message: 'Password is required',
                      },
                    }}
                  />
                  <FieldError name="password" className={fieldErrorClassName} />
                </div>

                <Submit className={buttonVariants({ className: 'w-full' })}>
                  Sign Up
                </Submit>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={routes.login()}
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default SignupPage
