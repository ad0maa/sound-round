/**
 * shadcn Input styling for @cedarjs/forms fields (TextField, PasswordField…),
 * mirroring src/components/ui/input.tsx so Cedar form fields match the
 * design system.
 */
export const inputClassName =
  'border-input placeholder:text-muted-foreground selection:bg-brand selection:text-white bg-card flex h-9 w-full min-w-0 rounded-full border px-3.5 py-1 text-sm caret-brand transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-foreground/45 focus-visible:border-brand'

export const inputErrorClassName = `${inputClassName} border-destructive`

export const labelClassName =
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50'

export const labelErrorClassName = `${labelClassName} text-destructive`

export const fieldErrorClassName = 'text-xs text-destructive mt-1'
