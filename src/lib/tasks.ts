import { daysUntil, formatDate, shiftDate } from "@/lib/dates"
import {
  PRIORITIES,
  RECURRENCES,
  TASK_STATUSES,
  type Priority,
  type Recurrence,
  type Task,
  type TaskInput,
  type TaskQuery,
  type TaskSort,
  type TaskStatus,
} from "@/types"

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  in_review: "In review",
  blocked: "Blocked",
  revision_required: "Revision required",
  completed: "Completed",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

export const STATUS_ORDER = TASK_STATUSES
export const PRIORITY_ORDER = PRIORITIES
export const RECURRENCE_ORDER = RECURRENCES

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value)
}

export function isPriority(value: string): value is Priority {
  return PRIORITIES.some((priority) => priority === value)
}

export function isOverdue(task: Pick<Task, "status" | "dueDate">, today: string) {
  return task.status !== "completed" && Boolean(task.dueDate) && task.dueDate < today
}

export function isDueToday(task: Pick<Task, "status" | "dueDate">, today: string) {
  return task.status !== "completed" && task.dueDate === today
}

export function dueLabel(task: Pick<Task, "status" | "dueDate">, today: string) {
  if (!task.dueDate) return "No due date"
  if (task.status === "completed") return formatDate(task.dueDate)
  const days = daysUntil(task.dueDate, today)
  if (days < 0) return `Overdue · ${formatDate(task.dueDate)}`
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return formatDate(task.dueDate)
}

export function memberName(tasksMembers: { id: string; name: string }[], id: string | null) {
  if (!id) return "Unassigned"
  return tasksMembers.find((member) => member.id === id)?.name ?? "Unknown teammate"
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function nextTaskId(tasks: Task[]) {
  const numbers = tasks.map((task) => Number(task.id.replace("TASK-", "")))
  const max = numbers.reduce((highest, value) => (Number.isFinite(value) ? Math.max(highest, value) : highest), 1000)
  return `TASK-${max + 1}`
}

export function createsCycle(
  tasks: Pick<Task, "id" | "dependencyIds">[],
  taskId: string,
  dependencyIds: string[],
) {
  if (dependencyIds.includes(taskId)) return true

  const edges = new Map(tasks.map((task) => [task.id, task.dependencyIds]))
  edges.set(taskId, dependencyIds)
  const stack = new Set<string>()
  const done = new Set<string>()

  const visit = (id: string): boolean => {
    if (stack.has(id)) return true
    if (done.has(id)) return false
    stack.add(id)
    for (const next of edges.get(id) ?? []) {
      if (visit(next)) return true
    }
    stack.delete(id)
    done.add(id)
    return false
  }

  return visit(taskId)
}

export function parentCreatesLoop(tasks: Pick<Task, "id" | "parentId">[], taskId: string, parentId: string | null) {
  if (!parentId) return false
  let current: string | null = parentId
  const seen = new Set<string>()
  while (current) {
    if (current === taskId || seen.has(current)) return true
    seen.add(current)
    current = tasks.find((task) => task.id === current)?.parentId ?? null
  }
  return false
}

export function validateTaskInput(input: TaskInput, tasks: Task[], editingId: string | null) {
  const errors: Record<string, string> = {}
  const title = input.title.trim()

  if (!title) errors.title = "Enter a task title."
  if (input.startDate && input.dueDate && input.startDate > input.dueDate) {
    errors.dueDate = "The due date must be on or after the start date."
  }
  if (editingId && input.dependencyIds.includes(editingId)) {
    errors.dependencies = "A task cannot depend on itself."
  }
  if (editingId && createsCycle(tasks, editingId, input.dependencyIds)) {
    errors.dependencies =
      "These dependencies would create a loop. A task cannot wait on work that is already waiting on it."
  }
  if (editingId && parentCreatesLoop(tasks, editingId, input.parentId)) {
    errors.parent = "Choose a parent task that is not already under this task."
  }
  if (input.parentId && editingId && input.parentId === editingId) {
    errors.parent = "A task cannot be its own parent."
  }

  return errors
}

export function prerequisiteState(task: Task, tasks: Task[], today: string) {
  return task.dependencyIds
    .map((id) => tasks.find((item) => item.id === id))
    .filter((item): item is Task => Boolean(item))
    .map((item) => {
      if (item.status === "completed") return { task: item, state: "completed" as const }
      if (item.status === "blocked" || isOverdue(item, today)) return { task: item, state: "blocking" as const }
      return { task: item, state: "pending" as const }
    })
}

export function dependentTasks(taskId: string, tasks: Task[]) {
  return tasks.filter((task) => task.dependencyIds.includes(taskId))
}

export function subtasksOf(taskId: string, tasks: Task[]) {
  return tasks.filter((task) => task.parentId === taskId)
}

export function relatedInstances(task: Task, tasks: Task[]) {
  if (!task.seriesId) return []
  return tasks
    .filter((item) => item.seriesId === task.seriesId && item.id !== task.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function unfinishedPrerequisites(task: Task, tasks: Task[]) {
  return task.dependencyIds
    .map((id) => tasks.find((item) => item.id === id))
    .filter((item): item is Task => Boolean(item && item.status !== "completed"))
}

export function statusChangeWarning(task: Task, nextStatus: TaskStatus, tasks: Task[]) {
  const unfinished = unfinishedPrerequisites(task, tasks)
  if (
    unfinished.length > 0 &&
    (nextStatus === "in_progress" || nextStatus === "in_review" || nextStatus === "completed")
  ) {
    const names = unfinished.map((item) => item.title).join(", ")
    return `This task still depends on unfinished work: ${names}. You can change the status, but that earlier work is not finished.`
  }

  if (nextStatus === "completed" && task.checklist.some((item) => !item.done)) {
    return "Some checklist items are still open. You can mark the task completed anyway."
  }

  return null
}

export function taskProgress(task: Task, tasks: Task[]) {
  if (task.checklist.length > 0) {
    const done = task.checklist.filter((item) => item.done).length
    return Math.round((done / task.checklist.length) * 100)
  }

  const subtasks = subtasksOf(task.id, tasks)
  if (subtasks.length > 0) {
    const done = subtasks.filter((item) => item.status === "completed").length
    return Math.round((done / subtasks.length) * 100)
  }

  const byStatus: Record<TaskStatus, number> = {
    not_started: 0,
    blocked: 20,
    in_progress: 45,
    revision_required: 55,
    in_review: 80,
    completed: 100,
  }
  return byStatus[task.status]
}

export function filterTasks(tasks: Task[], filters: TaskQuery, today: string) {
  const query = filters.query.trim().toLowerCase()

  return tasks.filter((task) => {
    if (query) {
      const haystack = `${task.title} ${task.description} ${task.id} ${task.notes}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (filters.status !== "all" && task.status !== filters.status) return false
    if (filters.assigneeId !== "all" && task.assigneeId !== filters.assigneeId) return false
    if (filters.priority !== "all" && task.priority !== filters.priority) return false
    if (filters.overdueOnly && !isOverdue(task, today)) return false
    if (filters.reviewOnly && task.status !== "in_review") return false
    return true
  })
}

export function sortTasks(tasks: Task[], sort: TaskSort) {
  return [...tasks].sort((a, b) => {
    if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt)
    if (sort === "priority") {
      const difference = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      if (difference !== 0) return difference
    }
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

export function dependencySentence(task: Task, tasks: Task[]) {
  const names = task.dependencyIds
    .map((id) => tasks.find((item) => item.id === id)?.title)
    .filter((name): name is string => Boolean(name))
  if (names.length === 0) return null
  if (names.length === 1) return `This task depends on: ${names[0]}.`
  return `This task depends on: ${names.join(", ")}.`
}

export function nextOccurrenceDates(task: Task, today: string) {
  if (task.recurrence === "none") return null
  const base = task.dueDate && task.dueDate > today ? task.dueDate : today
  const dueDate = shiftDate(base, task.recurrence)
  const startDate = task.startDate ? shiftDate(task.startDate > today ? task.startDate : today, task.recurrence) : ""
  return { startDate: startDate && startDate > dueDate ? dueDate : startDate, dueDate }
}

export function activeTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status !== "completed")
}

export function countByStatus(tasks: Task[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status).length
}
