import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  children?: React.ReactNode
}

const PageHeader = ({
  title,
  description,
  icon: Icon,
  children,
}: PageHeaderProps) => {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="ml-auto">{children}</div>}
    </header>
  )
}

export default PageHeader
