"use client"

import { useTasks } from "@/components/providers/task-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { memberName } from "@/lib/tasks"
import { useState } from "react"

export function ReviewActions({ taskId }: { taskId: string }) {
  const { tasks, members, currentUser, approveTask, requestRevision, resubmitForReview } = useTasks()
  const task = tasks.find((item) => item.id === taskId)
  const [mode, setMode] = useState<"approve" | "revision" | "resubmit" | null>(null)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")

  if (!task) return null
  const reviewer = memberName(members, task.reviewerId)

  function close() {
    setMode(null)
    setFeedback("")
    setError("")
  }

  function submit() {
    if (mode === "revision" && !feedback.trim()) {
      setError("Explain what needs to change.")
      return
    }
    if (mode === "approve") approveTask(taskId, feedback)
    if (mode === "revision") requestRevision(taskId, feedback)
    if (mode === "resubmit") resubmitForReview(taskId, feedback)
    close()
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {task.reviewerId
          ? `Assigned reviewer: ${reviewer}. This demo records the review under ${currentUser.name}.`
          : "No reviewer is assigned yet. You can still record a review in this demo."}
      </p>
      <div className="flex flex-wrap gap-2">
        {task.status === "in_review" ? (
          <>
            <Button onClick={() => setMode("approve")}>Approve</Button>
            <Button variant="outline" onClick={() => setMode("revision")}>
              Request revisions
            </Button>
          </>
        ) : null}
        {task.status === "revision_required" ? (
          <Button onClick={() => setMode("resubmit")}>Resubmit for review</Button>
        ) : null}
      </div>
      <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "approve" ? "Approve this task?" : mode === "revision" ? "Request revisions" : "Resubmit for review"}
            </DialogTitle>
            <DialogDescription>
              {mode === "approve"
                ? "Approval marks the task completed and keeps this feedback in the review history."
                : mode === "revision"
                  ? "The task will move to Revision required. Earlier feedback stays in the history."
                  : "The task will go back to the review queue. Previous feedback stays visible."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="review-feedback">{mode === "revision" ? "What needs to change?" : "Feedback"}</Label>
            <Textarea
              id="review-feedback"
              value={feedback}
              aria-invalid={Boolean(error)}
              onChange={(event) => setFeedback(event.target.value)}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit}>{mode === "approve" ? "Approve task" : mode === "revision" ? "Request revisions" : "Resubmit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
