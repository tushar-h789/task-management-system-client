"use client"

import { ReviewActions } from "@/components/reviews/review-actions"
import { useTasks } from "@/components/providers/task-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges"
import { StatusSelect } from "@/components/tasks/status-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { formatDate, formatDateTime } from "@/lib/dates"
import {
  dependencySentence,
  dependentTasks,
  dueLabel,
  isOverdue,
  memberName,
  prerequisiteState,
  RECURRENCE_LABELS,
  relatedInstances,
  subtasksOf,
  taskProgress,
  unfinishedPrerequisites,
} from "@/lib/tasks"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const prerequisiteLabel = {
  completed: "Completed",
  pending: "Still in progress",
  blocking: "Blocking progress",
} as const

export function TaskDetailView({ taskId }: { taskId: string }) {
  const router = useRouter()
  const {
    tasks,
    members,
    activity,
    today,
    highlightOverdue,
    openEdit,
    openCreate,
    addComment,
    toggleChecklistItem,
    addChecklistItem,
    createNextOccurrence,
  } = useTasks()
  const task = tasks.find((item) => item.id === taskId)
  const [comment, setComment] = useState("")
  const [step, setStep] = useState("")

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        description="This task is not in the current demo data."
        action={
          <Button variant="outline" onClick={() => router.push("/tasks")}>
            Back to all tasks
          </Button>
        }
      />
    )
  }

  const prerequisites = prerequisiteState(task, tasks, today)
  const dependents = dependentTasks(task.id, tasks)
  const subtasks = subtasksOf(task.id, tasks)
  const related = relatedInstances(task, tasks)
  const unfinished = unfinishedPrerequisites(task, tasks)
  const progress = taskProgress(task, tasks)
  const timeline = activity.filter((event) => event.taskId === task.id)
  const sentence = dependencySentence(task, tasks)
  const overdue = isOverdue(task, today)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{task.id}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{task.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{task.description || "No description yet."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {overdue ? <OverdueBadge /> : null}
              {task.tags.map((tag) => (
                <span key={tag} className="rounded-md border bg-card px-2 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={() => openEdit(task.id)}>
            Edit task
          </Button>
        </div>

        {unfinished.length > 0 ? (
          <div role="status" className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
            This task cannot reasonably move forward until {unfinished.map((item) => item.title).join(", ")}{" "}
            {unfinished.length === 1 ? "is" : "are"} finished.
          </div>
        ) : null}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm">{sentence ?? "This task does not depend on other tasks."}</p>
            {prerequisites.length > 0 ? (
              <ul className="grid gap-2">
                {prerequisites.map((item) => (
                  <li key={item.task.id}>
                    <Link href={`/tasks/${item.task.id}`} className="font-medium hover:text-primary">
                      {item.task.title}
                    </Link>
                    <span className="ml-2 text-sm text-muted-foreground">{prerequisiteLabel[item.state]}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <h3 className="text-sm font-medium">Tasks waiting for this one</h3>
              {dependents.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">No other tasks are waiting on this one.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {dependents.map((item) => (
                    <li key={item.id}>
                      <Link href={`/tasks/${item.id}`} className="hover:text-primary">
                        {item.title}
                      </Link>
                      <span className="ml-2 text-sm text-muted-foreground">{item.status === "completed" ? "Completed" : "Waiting"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Checklist and subtasks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Task progress" />
            </div>
            {task.checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist items yet.</p>
            ) : (
              <ul className="grid gap-2">
                {task.checklist.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={item.done} onCheckedChange={() => toggleChecklistItem(task.id, item.id)} />
                      <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                addChecklistItem(task.id, step)
                setStep("")
              }}
            >
              <Input value={step} onChange={(event) => setStep(event.target.value)} aria-label="New checklist item" placeholder="Add a checklist item" />
              <Button type="submit" variant="outline">
                Add
              </Button>
            </form>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Subtasks</h3>
                <Button variant="outline" size="sm" onClick={() => openCreate(task.id)}>
                  Add subtask
                </Button>
              </div>
              {subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subtasks yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {subtasks.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                      <Link href={`/tasks/${item.id}`} className="font-medium hover:text-primary">
                        {item.title}
                      </Link>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Review history</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ReviewActions taskId={task.id} />
            {task.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ol className="grid gap-3">
                {task.reviews.map((review) => (
                  <li key={review.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">
                      {review.outcome === "approved"
                        ? "Approved"
                        : review.outcome === "revision_requested"
                          ? "Revisions requested"
                          : "Submitted for review"}
                    </p>
                    <p className="mt-1 text-sm">{review.feedback}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {memberName(members, review.reviewerId)} · {formatDateTime(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {task.comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
            {task.comments.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="text-sm">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {memberName(members, item.authorId)} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                addComment(task.id, comment)
                setComment("")
              }}
            >
              <Input value={comment} onChange={(event) => setComment(event.target.value)} aria-label="Add a comment" placeholder="Add a note for the team" />
              <Button type="submit" variant="outline" className="justify-self-start">
                Add comment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <aside className="grid content-start gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <StatusSelect taskId={task.id} status={task.status} label={`Status for ${task.title}`} />
            <Person label="Assigned to" name={memberName(members, task.assigneeId)} />
            <Person label="Created by" name={memberName(members, task.creatorId)} />
            <Person label="Reviewer" name={task.reviewerId ? memberName(members, task.reviewerId) : "No reviewer"} />
            <p>
              <span className="block text-muted-foreground">Start date</span>
              {task.startDate ? formatDate(task.startDate) : "No start date"}
            </p>
            <p className={overdue && highlightOverdue ? "text-red-700" : ""}>
              <span className="block text-muted-foreground">Due date</span>
              {dueLabel(task, today)}
            </p>
            <p>
              <span className="block text-muted-foreground">Repeat</span>
              {RECURRENCE_LABELS[task.recurrence]}
            </p>
            {task.recurrence !== "none" ? (
              <Button
                variant="outline"
                onClick={() => {
                  const id = createNextOccurrence(task.id)
                  if (id) router.push(`/tasks/${id}`)
                }}
              >
                Create next occurrence
              </Button>
            ) : null}
            {task.notes ? (
              <p>
                <span className="block text-muted-foreground">Notes</span>
                {task.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
        {related.length > 0 ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Related occurrences</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {related.map((item) => (
                <Link key={item.id} href={`/tasks/${item.id}`} className="hover:text-primary">
                  {item.id} · {dueLabel(item, today)}
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
            {timeline.map((event) => (
              <div key={event.id}>
                <p className="text-sm">{event.message}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function Person({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <MemberAvatar name={name} size="sm" />
      <p>
        <span className="block text-xs text-muted-foreground">{label}</span>
        {name}
      </p>
    </div>
  )
}
