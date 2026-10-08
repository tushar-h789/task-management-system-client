"use client"

import { useTasks } from "@/components/providers/task-provider"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const navigation: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/tasks", label: "All Tasks", icon: ListTodo },
  { href: "/my-tasks", label: "My Tasks", icon: UserRound },
  { href: "/team", label: "Team Members", icon: Users },
  { href: "/reviews", label: "Task Reviews", icon: ClipboardCheck },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { currentUser } = useTasks()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          T
        </span>
        <div>
          <p className="text-sm font-semibold leading-none">Team Tasks</p>
          <p className="mt-1 text-xs text-muted-foreground">Internal workspace</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
        {navigation.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="m-3 flex items-center gap-2 rounded-lg border bg-card p-3">
        <MemberAvatar name={currentUser.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">{currentUser.role}</p>
        </div>
      </div>
    </div>
  )
}
