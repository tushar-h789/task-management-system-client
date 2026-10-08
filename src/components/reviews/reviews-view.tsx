"use client"

import { ReviewActions } from "@/components/reviews/review-actions"
import { useTasks } from "@/components/providers/task-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateTime } from "@/lib/dates"
import { dueLabel, memberName } from "@/lib/tasks"
import Link from "next/link"

export function ReviewsView() {
  const { tasks, members, today } = useTasks()
  const waiting = tasks.filter((task) => task.status === "in_review")
  const revisions = tasks.filter((task) => task.status === "revision_required")

  return (
    <Tabs defaultValue="waiting">
      <TabsList>
        <TabsTrigger value="waiting">Waiting for review ({waiting.length})</TabsTrigger>
        <TabsTrigger value="revisions">Revisions requested ({revisions.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="waiting" className="mt-4">
        <ReviewList
          emptyTitle="Nothing is waiting for review"
          emptyDescription="When someone submits a task, it will show up here."
          tasks={waiting}
          members={members}
          today={today}
        />
      </TabsContent>
      <TabsContent value="revisions" className="mt-4">
        <ReviewList
          emptyTitle="No revision requests"
          emptyDescription="Tasks that need more work after a review will appear here."
          tasks={revisions}
          members={members}
          today={today}
        />
      </TabsContent>
    </Tabs>
  )
}

function ReviewList({
  tasks,
  members,
  today,
  emptyTitle,
  emptyDescription,
}: {
  tasks: { id: string; title: string; assigneeId: string; reviewerId: string | null; submittedForReviewAt: string | null; dueDate: string; priority: "low" | "medium" | "high" | "urgent"; status: "not_started" | "in_progress" | "in_review" | "blocked" | "revision_required" | "completed"; reviews: { feedback: string; createdAt: string }[] }[]
  members: { id: string; name: string }[]
  today: string
  emptyTitle: string
  emptyDescription: string
}) {
  if (tasks.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />

  return (
    <div className="grid gap-3">
      {tasks.map((task) => {
        const latest = task.reviews[task.reviews.length - 1]
        return (
          <Card key={task.id} className="shadow-sm">
            <CardContent className="grid gap-4 pt-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Link href={`/tasks/${task.id}`} className="text-base font-semibold hover:text-primary">
                    {task.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assigned to {memberName(members, task.assigneeId)} · Reviewer {memberName(members, task.reviewerId)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submitted {task.submittedForReviewAt ? formatDateTime(task.submittedForReviewAt) : "not yet"} · {dueLabel(task, today)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
              {latest ? <p className="rounded-lg bg-muted px-3 py-2 text-sm">{latest.feedback}</p> : null}
              <ReviewActions taskId={task.id} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
