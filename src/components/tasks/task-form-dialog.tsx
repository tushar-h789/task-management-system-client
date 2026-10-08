"use client"

import { useTasks } from "@/components/providers/task-provider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createsCycle, parentCreatesLoop, PRIORITY_LABELS, PRIORITY_ORDER, RECURRENCE_LABELS, RECURRENCE_ORDER, STATUS_LABELS, STATUS_ORDER } from "@/lib/tasks"
import type { Priority, Recurrence, Task, TaskInput, TaskStatus } from "@/types"
import { useMemo, useState } from "react"

function emptyInput(userId: string, parentId: string | null): TaskInput {
  return {
    title: "",
    description: "",
    assigneeId: userId,
    creatorId: userId,
    reviewerId: null,
    priority: "medium",
    status: "not_started",
    startDate: "",
    dueDate: "",
    dependencyIds: [],
    parentId,
    tags: [],
    checklist: [],
    notes: "",
    recurrence: "none",
  }
}

function fromTask(task: Task): TaskInput {
  return {
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    creatorId: task.creatorId,
    reviewerId: task.reviewerId,
    priority: task.priority,
    status: task.status,
    startDate: task.startDate,
    dueDate: task.dueDate,
    dependencyIds: task.dependencyIds,
    parentId: task.parentId,
    tags: task.tags,
    checklist: task.checklist.map((item) => ({ ...item })),
    notes: task.notes,
    recurrence: task.recurrence,
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

export function TaskFormDialog() {
  const { form, closeForm } = useTasks()
  const formKey = form ? (form.mode === "edit" ? form.taskId : `create:${form.parentId ?? "root"}`) : "closed"

  return (
    <Dialog open={form !== null} onOpenChange={(next) => !next && closeForm()}>
      {form ? <TaskFormFields key={formKey} form={form} onClose={closeForm} /> : null}
    </Dialog>
  )
}

function TaskFormFields({
  form,
  onClose,
}: {
  form: NonNullable<ReturnType<typeof useTasks>["form"]>
  onClose: () => void
}) {
  const { tasks, members, currentUser, saveTask } = useTasks()
  const editingTask = form.mode === "edit" ? tasks.find((item) => item.id === form.taskId) : null
  const [input, setInput] = useState<TaskInput>(() =>
    editingTask ? fromTask(editingTask) : emptyInput(currentUser.id, form.mode === "create" ? form.parentId : null),
  )
  const [tagText, setTagText] = useState(() => editingTask?.tags.join(", ") ?? "")
  const [checklistDraft, setChecklistDraft] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editingId = form.mode === "edit" ? form.taskId : null

  const memberItems = useMemo(() => Object.fromEntries(members.map((member) => [member.id, member.name])), [members])
  const statusItems = useMemo(() => Object.fromEntries(STATUS_ORDER.map((status) => [status, STATUS_LABELS[status]])), [])
  const priorityItems = useMemo(
    () => Object.fromEntries(PRIORITY_ORDER.map((priority) => [priority, PRIORITY_LABELS[priority]])),
    [],
  )
  const recurrenceItems = useMemo(
    () => Object.fromEntries(RECURRENCE_ORDER.map((item) => [item, RECURRENCE_LABELS[item]])),
    [],
  )
  const reviewerItems = useMemo(() => ({ none: "No reviewer", ...memberItems }), [memberItems])
  const parentOptions = tasks.filter((task) => task.id !== editingId)
  const parentItems = useMemo(
    () => ({
      none: "No parent task",
      ...Object.fromEntries(parentOptions.map((task) => [task.id, task.title])),
    }),
    [parentOptions],
  )

  function update<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setInput((current) => ({ ...current, [key]: value }))
  }

  function submit() {
    const next: TaskInput = {
      ...input,
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    const result = saveTask(next, editingId)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onClose()
  }

  return (
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update the details and save when you are ready." : "Add a task for someone on the team."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">Task title</Label>
            <Input
              id="task-title"
              value={input.title}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "task-title-error" : undefined}
              onChange={(event) => update("title", event.target.value)}
            />
            <FieldError id="task-title-error" message={errors.title} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={input.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="task-assignee">Assigned to</Label>
              <Select items={memberItems} value={input.assigneeId} onValueChange={(value) => value && update("assigneeId", value)}>
                <SelectTrigger id="task-assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-creator">Created by</Label>
              <Select items={memberItems} value={input.creatorId} onValueChange={(value) => value && update("creatorId", value)}>
                <SelectTrigger id="task-creator" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                items={priorityItems}
                value={input.priority}
                onValueChange={(value) => value && update("priority", value as Priority)}
              >
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select
                items={statusItems}
                value={input.status}
                onValueChange={(value) => value && update("status", value as TaskStatus)}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-start">Start date</Label>
              <Input id="task-start" type="date" value={input.startDate} onChange={(event) => update("startDate", event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={input.dueDate}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? "task-due-error" : undefined}
                onChange={(event) => update("dueDate", event.target.value)}
              />
              <FieldError id="task-due-error" message={errors.dueDate} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-reviewer">Reviewer</Label>
              <Select
                items={reviewerItems}
                value={input.reviewerId ?? "none"}
                onValueChange={(value) => update("reviewerId", !value || value === "none" ? null : value)}
              >
                <SelectTrigger id="task-reviewer" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reviewer</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-repeat">Repeat</Label>
              <Select
                items={recurrenceItems}
                value={input.recurrence}
                onValueChange={(value) => value && update("recurrence", value as Recurrence)}
              >
                <SelectTrigger id="task-repeat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_ORDER.map((item) => (
                    <SelectItem key={item} value={item}>
                      {RECURRENCE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-parent">Parent task</Label>
            <Select
              items={parentItems}
              value={input.parentId ?? "none"}
              onValueChange={(value) => update("parentId", !value || value === "none" ? null : value)}
            >
              <SelectTrigger id="task-parent" className="w-full" aria-invalid={Boolean(errors.parent)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent task</SelectItem>
                {parentOptions.map((task) => {
                  const blocked = editingId ? parentCreatesLoop(tasks, editingId, task.id) : false
                  return (
                    <SelectItem key={task.id} value={task.id} disabled={blocked}>
                      {task.title}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FieldError id="task-parent-error" message={errors.parent} />
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Dependencies</legend>
            <p className="text-xs text-muted-foreground">Choose work that should be finished before this task.</p>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
              {tasks.filter((task) => task.id !== editingId).map((task) => {
                const selected = input.dependencyIds.includes(task.id)
                const cycle =
                  Boolean(editingId) &&
                  !selected &&
                  createsCycle(tasks, editingId ?? "", [...input.dependencyIds, task.id])
                return (
                  <label key={task.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selected}
                      disabled={cycle}
                      onCheckedChange={(checked) => {
                        update(
                          "dependencyIds",
                          checked
                            ? [...input.dependencyIds, task.id]
                            : input.dependencyIds.filter((id) => id !== task.id),
                        )
                      }}
                    />
                    <span>
                      <span className="font-medium">{task.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{task.id}</span>
                      {cycle ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Choosing this would create a loop.
                        </span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
            <FieldError id="task-dependencies-error" message={errors.dependencies} />
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="task-tags">Tags or category</Label>
            <Input
              id="task-tags"
              value={tagText}
              placeholder="Design, Launch"
              onChange={(event) => setTagText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checklist-item">Checklist</Label>
            <div className="flex gap-2">
              <Input
                id="checklist-item"
                value={checklistDraft}
                placeholder="Add a step"
                onChange={(event) => setChecklistDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  event.preventDefault()
                  const title = checklistDraft.trim()
                  if (!title) return
                  update("checklist", [...input.checklist, { title, done: false }])
                  setChecklistDraft("")
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const title = checklistDraft.trim()
                  if (!title) return
                  update("checklist", [...input.checklist, { title, done: false }])
                  setChecklistDraft("")
                }}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-2">
              {input.checklist.map((item, index) => (
                <li key={item.id ?? `${item.title}-${index}`} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={(checked) =>
                      update(
                        "checklist",
                        input.checklist.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, done: Boolean(checked) } : entry,
                        ),
                      )
                    }
                  />
                  <span className="flex-1">{item.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => update("checklist", input.checklist.filter((_, entryIndex) => entryIndex !== index))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" value={input.notes} onChange={(event) => update("notes", event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            {editingId ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}
