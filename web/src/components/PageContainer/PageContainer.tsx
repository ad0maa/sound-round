import { cn } from 'src/lib/utils'

type PageContainerProps = {
  children?: React.ReactNode
  className?: string
  wide?: boolean
}

/** Shared page padding/max-width for the authenticated app shell (matches the "pagepad" spec). */
const PageContainer = ({
  children,
  className,
  wide = true,
}: PageContainerProps) => (
  <div
    className={cn(
      'mx-auto w-full px-4 pb-10 pt-5 nav:px-10 nav:pb-[60px] nav:pt-8 animate-fade-in',
      wide ? 'max-w-[960px]' : 'max-w-[720px]',
      className
    )}
  >
    {children}
  </div>
)

export default PageContainer
