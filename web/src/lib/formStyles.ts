/**
 * shadcn Input styling for @cedarjs/forms fields (TextField, PasswordField…),
 * mirroring src/components/ui/input.tsx so Cedar form fields match the
 * design system.
 */
export const inputClassName =
  'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

export const inputErrorClassName = `${inputClassName} border-destructive ring-destructive/20`

export const labelClassName =
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50'

export const labelErrorClassName = `${labelClassName} text-destructive`

export const fieldErrorClassName = 'text-xs text-destructive mt-1'
