"use client"

import { useTasks } from "@/components/providers/task-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { OverdueBadge, PriorityBadge } from "@/components/tasks/task-badges"
import { StatusSelect } from "@/components/tasks/status-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dueLabel, filterTasks, isOverdue, memberName, PRIORITY_LABELS, PRIORITY_ORDER, sortTasks, STATUS_LABELS, STATUS_ORDER } from "@/lib/tasks"
import type { Priority, Task, TaskStatus } from "@/types"
import { GitBranch, Pencil } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

function readFilters(params: URLSearchParams) {
  const status = params.get("status")
  const priority = params.get("priority")
  const sort = params.get("sort")
  return {
    query: params.get("q") ?? "",
    status: status && STATUS_ORDER.includes(status as TaskStatus) ? (status as TaskStatus) : "all",
    assigneeId: params.get("assignee") ?? "all",
    priority: priority && PRIORITY_ORDER.includes(priority as Priority) ? (priority as Priority) : "all",
    overdueOnly: params.get("overdue") === "1",
    reviewOnly: params.get("review") === "1",
    sort: sort === "priority" || sort === "updated" ? sort : "due",
    view: params.get("view") === "board" ? "board" : "list",
  } as const
}

export function TasksView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { tasks, members, today, highlightOverdue, openCreate, openEdit } = useTasks()
  const filters = readFilters(searchParams)

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const visible = sortTasks(
    filterTasks(
      tasks,
      {
        query: filters.query,
        status: filters.status,
        assigneeId: filters.assigneeId,
        priority: filters.priority,
        overdueOnly: filters.overdueOnly,
        reviewOnly: filters.reviewOnly,
        sort: filters.sort,
      },
      today,
    ),
    filters.sort,
  )

  const statusItems = { all: "All statuses", ...Object.fromEntries(STATUS_ORDER.map((status) => [status, STATUS_LABELS[status]])) }
  const priorityItems = { all: "All priorities", ...Object.fromEntries(PRIORITY_ORDER.map((priority) => [priority, PRIORITY_LABELS[priority]])) }
  const assigneeItems = { all: "Everyone", ...Object.fromEntries(members.map((member) => [member.id, member.name])) }
  const sortItems = { due: "Due date", priority: "Priority", updated: "Recently updated" }
  const filtersActive =
    Boolean(filters.query) ||
    filters.status !== "all" ||
    filters.assigneeId !== "all" ||
    filters.priority !== "all" ||
    filters.overdueOnly ||
    filters.reviewOnly ||
    filters.sort !== "due"

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={filters.query}
              onChange={(event) => updateParams({ q: event.target.value || null })}
              placeholder="Search by title or description"
              aria-label="Search by title or description"
              className="lg:max-w-sm"
            />
            <Tabs
              value={filters.view}
              onValueChange={(value) => updateParams({ view: value === "board" ? "board" : null })}
            >
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground lg:ml-auto">
              {visible.length} {visible.length === 1 ? "task" : "tasks"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <Select items={statusItems} value={filters.status} onValueChange={(value) => updateParams({ status: !value || value === "all" ? null : value })}>
              <SelectTrigger className="w-full" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={assigneeItems} value={filters.assigneeId} onValueChange={(value) => updateParams({ assignee: !value || value === "all" ? null : value })}>
              <SelectTrigger className="w-full" aria-label="Filter by assigned person">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={priorityItems} value={filters.priority} onValueChange={(value) => updateParams({ priority: !value || value === "all" ? null : value })}>
              <SelectTrigger className="w-full" aria-label="Filter by priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITY_ORDER.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={sortItems} value={filters.sort} onValueChange={(value) => updateParams({ sort: !value || value === "due" ? null : value })}>
              <SelectTrigger className="w-full" aria-label="Sort tasks">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due">Due date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="updated">Recently updated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={filters.overdueOnly ? "default" : "outline"}
              onClick={() => updateParams({ overdue: filters.overdueOnly ? null : "1" })}
            >
              Overdue only
            </Button>
            <Button
              variant={filters.reviewOnly ? "default" : "outline"}
              onClick={() => updateParams({ review: filters.reviewOnly ? null : "1" })}
            >
              Waiting for review
            </Button>
          </div>
          {filtersActive ? (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.replace(pathname, { scroll: false })}
              >
                Clear all filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title="No tasks match"
          description="Try a different search or clear the filters to see the full list."
          action={
            <Button variant="outline" onClick={() => router.replace(pathname, { scroll: false })}>
              Clear filters
            </Button>
          }
        />
      ) : filters.view === "board" ? (
        <TaskBoard tasks={visible} today={today} highlightOverdue={highlightOverdue} members={members} onEdit={openEdit} />
      ) : (
        <TaskTable
          tasks={visible}
          today={today}
          highlightOverdue={highlightOverdue}
          members={members}
          allTasks={tasks}
          onEdit={openEdit}
        />
      )}
      <div className="sm:hidden">
        <Button className="w-full" onClick={() => openCreate()}>
          Create task
        </Button>
      </div>
    </div>
  )
}

function TaskTable({
  tasks,
  today,
  highlightOverdue,
  members,
  allTasks,
  onEdit,
}: {
  tasks: Task[]
  today: string
  highlightOverdue: boolean
  members: { id: string; name: string }[]
  allTasks: Task[]
  onEdit: (id: string) => void
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">All tasks</caption>
          <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-3 py-3 font-medium">Assigned to</th>
              <th className="px-3 py-3 font-medium">Priority</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Due</th>
              <th className="px-3 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const overdue = isOverdue(task, today)
              return (
                <tr key={task.id} className={overdue && highlightOverdue ? "border-t bg-red-50/60" : "border-t"}>
                  <td className="px-4 py-3">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary">
                      {task.title}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{task.description || "No description"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.id} · Created by {memberName(members, task.creatorId)}
                      {task.dependencyIds.length > 0 ? ` · Depends on ${task.dependencyIds.length}` : ""}
                      {task.status === "in_review" ? " · Waiting for review" : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <MemberAvatar name={memberName(members, task.assigneeId)} size="sm" />
                      {memberName(members, task.assigneeId)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusSelect taskId={task.id} status={task.status} />
                      {overdue ? <OverdueBadge /> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{dueLabel(task, today)}</td>
                  <td className="px-3 py-3">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task.id)}>
                      <Pencil />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} today={today} highlightOverdue={highlightOverdue} members={members} allTasks={allTasks} onEdit={onEdit} />
        ))}
      </div>
    </>
  )
}

function TaskBoard({
  tasks,
  today,
  highlightOverdue,
  members,
  onEdit,
}: {
  tasks: Task[]
  today: string
  highlightOverdue: boolean
  members: { id: string; name: string }[]
  onEdit: (id: string) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {STATUS_ORDER.map((status) => {
        const column = tasks.filter((task) => task.status === status)
        return (
          <section key={status} className="rounded-xl border bg-card p-3" aria-label={STATUS_LABELS[status]}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
              <span className="text-xs text-muted-foreground">{column.length}</span>
            </div>
            <div className="grid gap-3">
              {column.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No tasks here
                </p>
              ) : (
                column.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    highlightOverdue={highlightOverdue}
                    members={members}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TaskCard({
  task,
  today,
  highlightOverdue,
  members,
  onEdit,
}: {
  task: Task
  today: string
  highlightOverdue: boolean
  members: { id: string; name: string }[]
  allTasks?: Task[]
  onEdit: (id: string) => void
}) {
  const overdue = isOverdue(task, today)
  return (
    <article className={`rounded-xl border bg-background p-3 shadow-sm ${overdue && highlightOverdue ? "border-red-300" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary">
            {task.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description || "No description"}</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task.id)}>
          <Pencil />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {overdue ? <OverdueBadge /> : null}
        {task.dependencyIds.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="size-3" />
            {task.dependencyIds.length} {task.dependencyIds.length === 1 ? "dependency" : "dependencies"}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <MemberAvatar name={memberName(members, task.assigneeId)} size="sm" />
          {memberName(members, task.assigneeId)}
        </span>
        <span>{dueLabel(task, today)}</span>
      </div>
      <div className="mt-3">
        <StatusSelect taskId={task.id} status={task.status} />
      </div>
    </article>
  )
}
