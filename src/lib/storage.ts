import { isPriority, isTaskStatus } from "@/lib/tasks"
import {
  RECURRENCES,
  type ActivityEvent,
  type AppNotification,
  type Preferences,
  type Task,
} from "@/types"

export const STORAGE_KEY = "tms-demo-v1"

export type PersistedState = {
  tasks: Task[]
  notifications: AppNotification[]
  activity: ActivityEvent[]
  currentUserId: string
  preferences: Preferences
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    isTaskStatus(value.status) &&
    typeof value.priority === "string" &&
    isPriority(value.priority) &&
    typeof value.assigneeId === "string" &&
    Array.isArray(value.dependencyIds) &&
    Array.isArray(value.checklist) &&
    Array.isArray(value.reviews) &&
    Array.isArray(value.comments) &&
    typeof value.recurrence === "string" &&
    RECURRENCES.some((item) => item === value.recurrence)
  )
}

export function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !Array.isArray(parsed.tasks) || !parsed.tasks.every(isTask)) return null
    if (!Array.isArray(parsed.notifications) || !Array.isArray(parsed.activity)) return null
    if (typeof parsed.currentUserId !== "string") return null

    const preferences = isRecord(parsed.preferences) ? parsed.preferences : {}

    return {
      tasks: parsed.tasks,
      notifications: parsed.notifications as AppNotification[],
      activity: parsed.activity as ActivityEvent[],
      currentUserId: parsed.currentUserId,
      preferences: {
        highlightOverdue: preferences.highlightOverdue !== false,
      },
    }
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearPersistedState() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
