interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

const PageHeader = ({ title, description, children }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex items-end gap-4">
      <div>
        <h1 className="text-[40px]">{title}</h1>
        {description && (
          <p className="mt-1.5 text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="ml-auto flex flex-none gap-2.5">{children}</div>
      )}
    </div>
  )
}

export default PageHeader
