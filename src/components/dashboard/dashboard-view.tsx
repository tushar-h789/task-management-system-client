"use client"

import { useTasks } from "@/components/providers/task-provider"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatDateTime } from "@/lib/dates"
import { activeTasks, countByStatus, dueLabel, isOverdue, memberName } from "@/lib/tasks"
import { Ban, CheckCircle2, ClipboardList, Clock3, Eye, ListTodo } from "lucide-react"
import Link from "next/link"

export function DashboardView() {
  const { tasks, members, activity, today, highlightOverdue } = useTasks()
  const overdue = tasks.filter((task) => isOverdue(task, today))
  const summary = [
    { label: "Total tasks", value: tasks.length, icon: ListTodo, href: "/tasks" },
    { label: "In progress", value: countByStatus(tasks, "in_progress"), icon: Clock3, href: "/tasks?status=in_progress" },
    { label: "Awaiting review", value: countByStatus(tasks, "in_review"), icon: Eye, href: "/reviews" },
    { label: "Blocked tasks", value: countByStatus(tasks, "blocked"), icon: Ban, href: "/tasks?status=blocked" },
    { label: "Completed tasks", value: countByStatus(tasks, "completed"), icon: CheckCircle2, href: "/tasks?status=completed" },
    { label: "Overdue tasks", value: overdue.length, icon: ClipboardList, href: "/tasks?overdue=1" },
  ]
  const priorityTasks = [...tasks]
    .filter((task) => task.status !== "completed" && (isOverdue(task, today) || task.status === "blocked" || task.priority === "urgent"))
    .sort((a, b) => Number(isOverdue(b, today)) - Number(isOverdue(a, today)) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)
  const recent = [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  const upcoming = tasks
    .filter((task) => task.status !== "completed" && task.dueDate >= today && task.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)
  const openCounts = members.map((member) => activeTasks(tasks).filter((task) => task.assigneeId === member.id).length)
  const maxOpen = Math.max(1, ...openCounts)

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summary.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href} className="rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
              <Card className="h-full shadow-sm transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{item.label}</CardDescription>
                  <Icon className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="shadow-sm xl:col-span-3">
          <CardHeader>
            <CardTitle>Priority tasks</CardTitle>
            <CardDescription>Overdue, blocked, and urgent work that needs attention first.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {priorityTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing urgent right now.</p>
            ) : (
              priorityTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="rounded-lg border bg-background p-3 hover:border-primary/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{task.title}</span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {isOverdue(task, today) ? <OverdueBadge /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {memberName(members, task.assigneeId)} · {dueLabel(task, today)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Tasks due in the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines in the next week.</p>
            ) : (
              upcoming.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:border-primary/40">
                  <span>
                    <span className="block font-medium">{task.title}</span>
                    <span className="text-sm text-muted-foreground">{memberName(members, task.assigneeId)}</span>
                  </span>
                  <span className={`shrink-0 text-sm ${isOverdue(task, today) && highlightOverdue ? "text-red-700" : "text-muted-foreground"}`}>
                    {dueLabel(task, today)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="shadow-sm xl:col-span-3">
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
            <CardDescription>The latest created or updated work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recent.map((task) => (
              <div key={task.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary">
                    {task.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {memberName(members, task.assigneeId)} · {dueLabel(task, today)}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>A short history of team updates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activity.slice(0, 6).map((event) => (
              <div key={event.id} className="grid gap-1">
                <p className="text-sm">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {memberName(members, event.actorId)} · {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Team workload</CardTitle>
          <CardDescription>Open tasks show who has work in progress. This is not a performance score.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {members.map((member) => {
            const open = activeTasks(tasks).filter((task) => task.assigneeId === member.id).length
            const completed = tasks.filter((task) => task.assigneeId === member.id && task.status === "completed").length
            return (
              <Link key={member.id} href={`/team/${member.id}`} className="rounded-lg border p-3 hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <MemberAvatar name={member.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role} · {open} open · {completed} completed
                    </p>
                  </div>
                </div>
                <Progress value={(open / maxOpen) * 100} className="mt-3" aria-label={`${member.name} has ${open} open tasks`} />
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
  date.setDate(date.getDate() + days)
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  const nextDay = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`
}
