import * as React from 'react'

import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from 'src/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-foreground/[0.12] relative h-[9px] w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-brand h-full w-full flex-1 transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
