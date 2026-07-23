import { useEffect, useRef } from 'react'

import { Music } from 'lucide-react'

import { Form, Label, TextField, Submit, FieldError } from '@cedarjs/forms'
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
import { toastOptions } from 'src/lib/toastOptions'

const ForgotPasswordPage = () => {
  const { isAuthenticated, forgotPassword } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef?.current?.focus()
  }, [])

  const onSubmit = async (data: { username: string }) => {
    const response = await forgotPassword(data.username)

    if (response.error) {
      toast.error(response.error)
    } else {
      // The function `forgotPassword.handler` in api/src/functions/auth.js has
      // been invoked, let the user know how to get the link to reset their
      // password (sent in email, perhaps?)
      toast.success(
        'A link to reset your password was sent to ' + response.email
      )
      navigate(routes.login())
    }
  }

  return (
    <>
      <Metadata title="Forgot Password" />

      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Toaster
          position="top-right"
          toastOptions={{ ...toastOptions, duration: 6000 }}
        />
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-brand-600 text-white">
              <Music className="h-1/2 w-1/2" strokeWidth={2.75} />
            </span>
            <span className="font-heading text-2xl">SoundRound</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forgot password</CardTitle>
              <CardDescription>
                We&apos;ll email you a link to reset it.
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

                <Submit className={buttonVariants({ className: 'w-full' })}>
                  Send reset link
                </Submit>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to={routes.login()}
              className="font-medium text-brand hover:underline"
            >
              Back to log in
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default ForgotPasswordPage
