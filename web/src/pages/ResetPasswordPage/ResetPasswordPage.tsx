import { useEffect, useRef, useState } from 'react'

import { Music } from 'lucide-react'

import { Form, Label, PasswordField, Submit, FieldError } from '@cedarjs/forms'
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

const ResetPasswordPage = ({ resetToken }: { resetToken: string }) => {
  const { isAuthenticated, reauthenticate, validateResetToken, resetPassword } =
    useAuth()
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  useEffect(() => {
    const validateToken = async () => {
      const response = await validateResetToken(resetToken)
      if (response.error) {
        setEnabled(false)
        toast.error(response.error)
      } else {
        setEnabled(true)
      }
    }
    validateToken()
  }, [resetToken, validateResetToken])

  const passwordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await resetPassword({
      resetToken,
      password: data.password,
    })

    if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Password changed!')
      await reauthenticate()
      navigate(routes.login())
    }
  }

  return (
    <>
      <Metadata title="Reset Password" />

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
              <CardTitle>Reset password</CardTitle>
              <CardDescription>Choose a new password below.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    name="password"
                    className={labelClassName}
                    errorClassName={labelErrorClassName}
                  >
                    New password
                  </Label>
                  <PasswordField
                    name="password"
                    autoComplete="new-password"
                    className={inputClassName}
                    errorClassName={inputErrorClassName}
                    disabled={!enabled}
                    ref={passwordRef}
                    validation={{
                      required: {
                        value: true,
                        message: 'New password is required',
                      },
                    }}
                  />
                  <FieldError name="password" className={fieldErrorClassName} />
                </div>

                <Submit
                  className={buttonVariants({ className: 'w-full' })}
                  disabled={!enabled}
                >
                  Reset password
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

export default ResetPasswordPage
