"use client"

import { useTasks } from "@/components/providers/task-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { OverdueBadge, StatusBadge } from "@/components/tasks/task-badges"
import { StatusSelect } from "@/components/tasks/status-select"
import { Button } from "@/components/ui/button"
import { dueLabel, isOverdue } from "@/lib/tasks"
import type { Task } from "@/types"
import Link from "next/link"

export function MyTasksView() {
  const { tasks, currentUser, today, setCurrentUserId, members, openCreate } = useTasks()
  const mine = tasks.filter((task) => task.assigneeId === currentUser.id)
  const sections = [
    { title: "Overdue", description: "These dates have already passed.", tasks: mine.filter((task) => isOverdue(task, today)) },
    { title: "Tasks to start", description: "Assigned work that has not started.", tasks: mine.filter((task) => task.status === "not_started") },
    { title: "In progress", description: "Work you are doing now.", tasks: mine.filter((task) => task.status === "in_progress") },
    { title: "Waiting for review", description: "Submitted and waiting for a reviewer.", tasks: mine.filter((task) => task.status === "in_review") },
    { title: "Needs revisions", description: "A reviewer asked for more work.", tasks: mine.filter((task) => task.status === "revision_required") },
    {
      title: "Upcoming deadlines",
      description: "Due within the next 7 days.",
      tasks: mine.filter((task) => task.status !== "completed" && task.dueDate >= today && task.dueDate <= shift(today, 7) && !isOverdue(task, today)),
    },
  ]

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground">Showing tasks assigned to the selected demo user.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <Button
              key={member.id}
              size="sm"
              variant={member.id === currentUser.id ? "default" : "outline"}
              onClick={() => setCurrentUserId(member.id)}
            >
              {member.name.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>
      {mine.length === 0 ? (
        <EmptyState
          title="No tasks assigned"
          description="This person does not have any tasks yet."
          action={<Button onClick={() => openCreate()}>Create task</Button>}
        />
      ) : (
        sections.map((section) => (
          <section key={section.title} className="grid gap-3">
            <div>
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            {section.tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-sm text-muted-foreground">Nothing in this group.</p>
            ) : (
              <div className="grid gap-3">
                {section.tasks.map((task) => (
                  <TaskRow key={`${section.title}-${task.id}`} task={task} today={today} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  )
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const overdue = isOverdue(task, today)
  return (
    <article className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary">
          {task.title}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{dueLabel(task, today)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          {overdue ? <OverdueBadge /> : null}
        </div>
      </div>
      <div className="sm:w-44">
        <StatusSelect taskId={task.id} status={task.status} />
      </div>
    </article>
  )
}

function shift(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
