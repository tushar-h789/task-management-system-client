"use client"

import { isNavActive, navigation } from "@/components/layout/sidebar-nav"
import { useTasks } from "@/components/providers/task-provider"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { OverdueBadge, StatusBadge } from "@/components/tasks/task-badges"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { isOverdue } from "@/lib/tasks"
import type { Task } from "@/types"
import { Bell, Menu, Plus, Search } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"

function SearchResults({
  results,
  today,
  onOpen,
  onSeeAll,
}: {
  results: Task[]
  today: string
  onOpen: () => void
  onSeeAll: () => void
}) {
  return (
    <div className="absolute top-full z-40 mt-2 w-full rounded-lg border bg-popover p-1 shadow-md">
      {results.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted-foreground">No tasks match that search.</p>
      ) : (
        results.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            onClick={onOpen}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{task.title}</span>
              <span className="text-xs text-muted-foreground">{task.id}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {isOverdue(task, today) ? <OverdueBadge /> : null}
              <StatusBadge status={task.status} />
            </span>
          </Link>
        ))
      )}
      <button
        type="button"
        className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-primary hover:bg-muted"
        onClick={onSeeAll}
      >
        See all matching tasks
      </button>
    </div>
  )
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/tasks/")) return "Task details"
  const match = navigation.find((item) => isNavActive(pathname, item.href, item.exact))
  return match?.label ?? "Team Tasks"
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitle(pathname)
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    tasks,
    today,
    members,
    currentUser,
    notifications,
    unreadCount,
    openCreate,
    setCurrentUserId,
    markNotificationRead,
    markAllNotificationsRead,
  } = useTasks()

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return tasks
      .filter((task) => `${task.title} ${task.description} ${task.id}`.toLowerCase().includes(needle))
      .slice(0, 6)
  }, [query, tasks])

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation" />}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {pathname !== "/" ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="relative hidden w-full max-w-sm lg:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="pl-8"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                router.push(query.trim() ? `/tasks?q=${encodeURIComponent(query.trim())}` : "/tasks")
                setQuery("")
              }
            }}
          />
          {query.trim() ? (
            <SearchResults
              results={results}
              today={today}
              onOpen={() => setQuery("")}
              onSeeAll={() => {
                router.push(`/tasks?q=${encodeURIComponent(query.trim())}`)
                setQuery("")
              }}
            />
          ) : null}
        </div>

        <Button onClick={() => openCreate()} className="hidden sm:inline-flex">
          <Plus />
          Create task
        </Button>
        <Button size="icon" aria-label="Create task" className="sm:hidden" onClick={() => openCreate()}>
          <Plus />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" className="relative" aria-label={`Notifications, ${unreadCount} unread`} />
            }
          >
            <Bell />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Demo notifications</DropdownMenuLabel>
              <p className="px-1.5 pb-2 text-xs text-muted-foreground">
                These alerts stay inside the app. No emails are sent.
              </p>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">You are all caught up.</p>
              ) : (
                notifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="items-start"
                    onClick={() => {
                      markNotificationRead(item.id)
                      if (item.taskId) router.push(`/tasks/${item.taskId}`)
                    }}
                  >
                    <span className="grid gap-0.5">
                      <span className="font-medium">
                        {item.title}
                        {item.read ? null : <span className="ml-2 text-xs text-primary">New</span>}
                      </span>
                      <span className="text-xs whitespace-normal text-muted-foreground">{item.body}</span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={markAllNotificationsRead}>Mark all as read</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 gap-2 px-1.5" aria-label="Open profile menu" />}
          >
            <MemberAvatar name={currentUser.name} size="sm" />
            <span className="hidden max-w-28 truncate text-sm md:inline">{currentUser.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {currentUser.name}
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{currentUser.role}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Preview as</DropdownMenuLabel>
            {members.map((member) => (
              <DropdownMenuItem key={member.id} onClick={() => setCurrentUserId(member.id)}>
                {member.name}
                {member.id === currentUser.id ? <span className="ml-auto text-xs text-primary">Current</span> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="px-4 pb-3 lg:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="pl-8"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                router.push(query.trim() ? `/tasks?q=${encodeURIComponent(query.trim())}` : "/tasks")
                setQuery("")
              }
            }}
          />
          {query.trim() ? (
            <SearchResults
              results={results}
              today={today}
              onOpen={() => setQuery("")}
              onSeeAll={() => {
                router.push(`/tasks?q=${encodeURIComponent(query.trim())}`)
                setQuery("")
              }}
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
