export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "in_review",
  "blocked",
  "revision_required",
  "completed",
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const

export type Priority = (typeof PRIORITIES)[number]

export const RECURRENCES = ["none", "daily", "weekly", "monthly"] as const

export type Recurrence = (typeof RECURRENCES)[number]

export type ReviewOutcome = "approved" | "revision_requested" | "submitted"

export type Member = {
  id: string
  name: string
  role: string
  email: string
}

export type ChecklistItem = {
  id: string
  title: string
  done: boolean
}

export type ReviewEntry = {
  id: string
  reviewerId: string
  outcome: ReviewOutcome
  feedback: string
  createdAt: string
}

export type Comment = {
  id: string
  authorId: string
  body: string
  createdAt: string
}

export type Task = {
  id: string
  title: string
  description: string
  assigneeId: string
  creatorId: string
  reviewerId: string | null
  priority: Priority
  status: TaskStatus
  startDate: string
  dueDate: string
  dependencyIds: string[]
  parentId: string | null
  tags: string[]
  checklist: ChecklistItem[]
  notes: string
  recurrence: Recurrence
  seriesId: string | null
  previousInstanceId: string | null
  reviews: ReviewEntry[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
  submittedForReviewAt: string | null
}

export type ActivityType =
  | "created"
  | "updated"
  | "status_changed"
  | "assigned"
  | "review"
  | "completed"
  | "comment"
  | "recurrence"

export type ActivityEvent = {
  id: string
  taskId: string
  type: ActivityType
  message: string
  actorId: string
  createdAt: string
}

export type NotificationType =
  | "assignment"
  | "deadline"
  | "review_request"
  | "revision"
  | "blocked"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  taskId: string | null
  read: boolean
  createdAt: string
}

export type ChecklistDraft = {
  id?: string
  title: string
  done: boolean
}

export type TaskInput = {
  title: string
  description: string
  assigneeId: string
  creatorId: string
  reviewerId: string | null
  priority: Priority
  status: TaskStatus
  startDate: string
  dueDate: string
  dependencyIds: string[]
  parentId: string | null
  tags: string[]
  checklist: ChecklistDraft[]
  notes: string
  recurrence: Recurrence
}

export type Preferences = {
  highlightOverdue: boolean
}

export type TaskSort = "due" | "priority" | "updated"

export type TaskQuery = {
  query: string
  status: TaskStatus | "all"
  assigneeId: string | "all"
  priority: Priority | "all"
  overdueOnly: boolean
  reviewOnly: boolean
  sort: TaskSort
}

export const DEMO_TODAY = "2026-10-08"
export const DEFAULT_USER_ID = "m-maya"
