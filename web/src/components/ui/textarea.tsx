import * as React from 'react'

import { cn } from 'src/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground selection:bg-brand selection:text-white bg-card flex min-h-20 w-full min-w-0 resize-y rounded-2xl border px-3.5 py-2.5 text-sm caret-brand transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-foreground/45 focus-visible:border-brand',
        'aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
