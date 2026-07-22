import { useEffect, useRef } from 'react'

import { Music } from 'lucide-react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
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

const LoginPage = () => {
  const { isAuthenticated, logIn } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await logIn({
      username: data.username,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Welcome back!')
    }
  }

  return (
    <>
      <Metadata title="Login" />

      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Toaster toastOptions={{ duration: 6000 }} />
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-2xl font-bold text-transparent">
              SoundRound
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log in</CardTitle>
              <CardDescription>
                Welcome back — your leagues await.
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

                <div className="text-right">
                  <Link
                    to={routes.forgotPassword()}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Submit className={buttonVariants({ className: 'w-full' })}>
                  Log In
                </Submit>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to={routes.signup()}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default LoginPage
