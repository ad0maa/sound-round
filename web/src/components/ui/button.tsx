import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from 'src/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-heading font-normal transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:outline-destructive',
        outline:
          'border border-divider bg-transparent text-foreground hover:bg-foreground/[0.07] active:bg-foreground/[0.14]',
        secondary:
          'border border-divider bg-transparent text-foreground hover:bg-foreground/[0.07] active:bg-foreground/[0.14]',
        ghost: 'text-brand hover:bg-brand/10 active:bg-brand/[0.18]',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm has-[>svg]:px-3.5',
        sm: 'h-8 gap-1 px-3 text-sm has-[>svg]:px-2.5',
        lg: 'h-11 px-6 text-base has-[>svg]:px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
