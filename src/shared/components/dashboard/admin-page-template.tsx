import { Suspense } from "react"
import Link from "next/link"
import { ContentLayout } from "@/shared/components/dashboard/content-layout"
import { Card, CardContent } from "@/shared/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"

interface AdminPageTemplateProps {
  // Required props
  title: string
  children: React.ReactNode
  
  // Optional props
  description?: string
  backLink?: { href: string; label: string }
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  showCard?: boolean
}

export function AdminPageTemplate({
  title,
  children,
  description,
  backLink,
  actions,
  breadcrumbs = [{ label: "Bảng điều khiển", href: "/dashboard/admin" }],
  showCard = true
}: AdminPageTemplateProps) {
  // Add current page as final breadcrumb
  const allBreadcrumbs = [...breadcrumbs, { label: title }]

  const content = (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {backLink && (
            <Link 
              href={backLink.href} 
              className="text-sm text-blue-600 hover:underline"
            >
              ← {backLink.label}
            </Link>
          )}
          {actions}
        </div>
      </div>

      {/* Content */}
      {showCard ? (
        <Card className="rounded-lg border-none mt-6">
          <CardContent className="p-6">
            <div className="min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
              {children}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <ContentLayout title={title} role="admin">
      <Breadcrumb>
        <BreadcrumbList>
          {allBreadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {content}
    </ContentLayout>
  )
}

// Wrapper for client components with Suspense
interface AdminPageWithSuspenseProps extends AdminPageTemplateProps {
  fallback?: React.ReactNode
}

export function AdminPageWithSuspense({
  fallback = <div>Đang tải...</div>,
  ...props
}: AdminPageWithSuspenseProps) {
  return (
    <AdminPageTemplate {...props}>
      <Suspense fallback={fallback}>
        {props.children}
      </Suspense>
    </AdminPageTemplate>
  )
}
