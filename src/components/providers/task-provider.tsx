"use client"

import { createDemoState, members } from "@/data/mock-data"
import { toISODate } from "@/lib/dates"
import { loadPersistedState, savePersistedState } from "@/lib/storage"
import {
  nextOccurrenceDates,
  nextTaskId,
  STATUS_LABELS,
  statusChangeWarning,
  validateTaskInput,
} from "@/lib/tasks"
import {
  DEMO_TODAY,
  type ActivityEvent,
  type ActivityType,
  type AppNotification,
  type Member,
  type NotificationType,
  type ReviewEntry,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/types"
import { toast } from "sonner"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type FormRequest =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; taskId: string }

type PendingStatus = {
  taskId: string
  status: TaskStatus
  message: string
}

type Store = ReturnType<typeof createDemoState>

type TaskContextValue = {
  tasks: Task[]
  members: Member[]
  notifications: AppNotification[]
  activity: ActivityEvent[]
  currentUserId: string
  currentUser: Member
  today: string
  highlightOverdue: boolean
  hydrated: boolean
  form: FormRequest | null
  pendingStatus: PendingStatus | null
  unreadCount: number
  setCurrentUserId: (id: string) => void
  setHighlightOverdue: (value: boolean) => void
  openCreate: (parentId?: string | null) => void
  openEdit: (taskId: string) => void
  closeForm: () => void
  saveTask: (input: TaskInput, editingId: string | null) => { ok: true; id: string } | { ok: false; errors: Record<string, string> }
  requestStatusChange: (taskId: string, status: TaskStatus) => void
  confirmStatusChange: () => void
  cancelStatusChange: () => void
  addComment: (taskId: string, body: string) => void
  toggleChecklistItem: (taskId: string, itemId: string) => void
  addChecklistItem: (taskId: string, title: string) => void
  approveTask: (taskId: string, feedback: string) => void
  requestRevision: (taskId: string, feedback: string) => boolean
  resubmitForReview: (taskId: string, note: string) => void
  createNextOccurrence: (taskId: string) => string | null
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  resetDemoData: () => void
}

const TaskContext = createContext<TaskContextValue | null>(null)

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => createDemoState())
  const [hydrated, setHydrated] = useState(false)
  const [today, setToday] = useState(DEMO_TODAY)
  const [form, setForm] = useState<FormRequest | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadPersistedState()
      if (stored && members.some((member) => member.id === stored.currentUserId)) {
        setStore(stored)
      }
      setToday(toISODate(new Date()))
      setHydrated(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    savePersistedState(store)
  }, [store, hydrated])

  const currentUser = members.find((member) => member.id === store.currentUserId) ?? members[0]

  const addActivity = useCallback((events: ActivityEvent[], event: Omit<ActivityEvent, "id" | "createdAt">) => {
    return [{ ...event, id: createId("act"), createdAt: nowIso() }, ...events]
  }, [])

  const addNotification = useCallback(
    (items: AppNotification[], notification: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      return [{ ...notification, id: createId("note"), createdAt: nowIso(), read: false }, ...items]
    },
    [],
  )

  const applyStatus = useCallback(
    (current: Store, taskId: string, status: TaskStatus) => {
      const task = current.tasks.find((item) => item.id === taskId)
      if (!task || task.status === status) return current
      const timestamp = nowIso()
      const tasks = current.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status,
              updatedAt: timestamp,
              submittedForReviewAt: status === "in_review" ? timestamp : item.submittedForReviewAt,
            }
          : item,
      )
      const activity = addActivity(current.activity, {
        taskId,
        type: status === "completed" ? "completed" : "status_changed",
        actorId: current.currentUserId,
        message:
          status === "completed"
            ? `Completed “${task.title}”.`
            : `Changed “${task.title}” to ${STATUS_LABELS[status]}.`,
      })
      let notifications = current.notifications
      if (status === "in_review" && task.reviewerId) {
        notifications = addNotification(notifications, {
          type: "review_request",
          title: "Task waiting for review",
          body: `“${task.title}” was sent for review.`,
          taskId,
        })
      }
      if (status === "blocked") {
        notifications = addNotification(notifications, {
          type: "blocked",
          title: "Task marked blocked",
          body: `“${task.title}” is blocked.`,
          taskId,
        })
      }
      return { ...current, tasks, activity, notifications }
    },
    [addActivity, addNotification],
  )

  const saveTask = useCallback(
    (input: TaskInput, editingId: string | null) => {
      const errors = validateTaskInput(input, store.tasks, editingId)
      if (Object.keys(errors).length > 0) return { ok: false as const, errors }

      const timestamp = nowIso()
      const checklist = input.checklist
        .map((item) => ({ ...item, title: item.title.trim() }))
        .filter((item) => item.title)
        .map((item) => ({ id: item.id ?? createId("chk"), title: item.title, done: item.done }))

      if (!editingId) {
        const id = nextTaskId(store.tasks)
        const task: Task = {
          ...input,
          id,
          title: input.title.trim(),
          checklist,
          seriesId: input.recurrence === "none" ? null : id,
          previousInstanceId: null,
          reviews: [],
          comments: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          submittedForReviewAt: input.status === "in_review" ? timestamp : null,
        }
        setStore((current) => {
          let notifications = current.notifications
          if (task.assigneeId !== current.currentUserId) {
            notifications = addNotification(notifications, {
              type: "assignment",
              title: "New task assigned",
              body: `“${task.title}” was assigned.`,
              taskId: id,
            })
          }
          const unfinished = task.dependencyIds.filter((dependencyId) => {
            const dependency = current.tasks.find((item) => item.id === dependencyId)
            return dependency && dependency.status !== "completed"
          })
          if (unfinished.length > 0) {
            notifications = addNotification(notifications, {
              type: "blocked",
              title: "Task has unfinished dependencies",
              body: `“${task.title}” is waiting on earlier work.`,
              taskId: id,
            })
          }
          return {
            ...current,
            tasks: [task, ...current.tasks],
            notifications,
            activity: addActivity(current.activity, {
              taskId: id,
              type: "created",
              actorId: current.currentUserId,
              message: `Created “${task.title}”.`,
            }),
          }
        })
        toast.success("Task created")
        return { ok: true as const, id }
      }

      const existing = store.tasks.find((item) => item.id === editingId)
      if (!existing) return { ok: false as const, errors: { title: "This task could not be found." } }

      setStore((current) => ({
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...input,
                title: input.title.trim(),
                checklist,
                seriesId: input.recurrence === "none" ? item.seriesId : item.seriesId ?? item.id,
                updatedAt: timestamp,
              }
            : item,
        ),
        activity: addActivity(current.activity, {
          taskId: editingId,
          type: input.assigneeId !== existing.assigneeId ? "assigned" : "updated",
          actorId: current.currentUserId,
          message:
            input.assigneeId !== existing.assigneeId
              ? `Reassigned “${input.title.trim()}”.`
              : `Updated “${input.title.trim()}”.`,
        }),
      }))
      toast.success("Task updated")
      return { ok: true as const, id: editingId }
    },
    [addActivity, addNotification, store.tasks],
  )

  const requestStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      const task = store.tasks.find((item) => item.id === taskId)
      if (!task || task.status === status) return
      const message = statusChangeWarning(task, status, store.tasks)
      if (message) {
        setPendingStatus({ taskId, status, message })
        return
      }
      setStore((current) => applyStatus(current, taskId, status))
      toast.success("Status updated")
    },
    [applyStatus, store.tasks],
  )

  const confirmStatusChange = useCallback(() => {
    if (!pendingStatus) return
    setStore((current) => applyStatus(current, pendingStatus.taskId, pendingStatus.status))
    setPendingStatus(null)
    toast.success("Status updated")
  }, [applyStatus, pendingStatus])

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks: store.tasks,
      members,
      notifications: store.notifications,
      activity: store.activity,
      currentUserId: store.currentUserId,
      currentUser,
      today,
      highlightOverdue: store.preferences.highlightOverdue,
      hydrated,
      form,
      pendingStatus,
      unreadCount: store.notifications.filter((item) => !item.read).length,
      setCurrentUserId: (id) => {
        if (!members.some((member) => member.id === id)) return
        setStore((current) => ({ ...current, currentUserId: id }))
        const name = members.find((member) => member.id === id)?.name
        toast.success(`Now viewing work as ${name}`)
      },
      setHighlightOverdue: (highlightOverdue) =>
        setStore((current) => ({ ...current, preferences: { ...current.preferences, highlightOverdue } })),
      openCreate: (parentId = null) => setForm({ mode: "create", parentId }),
      openEdit: (taskId) => setForm({ mode: "edit", taskId }),
      closeForm: () => setForm(null),
      saveTask,
      requestStatusChange,
      confirmStatusChange,
      cancelStatusChange: () => setPendingStatus(null),
      addComment: (taskId, body) => {
        const text = body.trim()
        if (!text) return
        const timestamp = nowIso()
        setStore((current) => {
          const task = current.tasks.find((item) => item.id === taskId)
          if (!task) return current
          return {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === taskId
                ? {
                    ...item,
                    updatedAt: timestamp,
                    comments: [...item.comments, { id: createId("c"), authorId: current.currentUserId, body: text, createdAt: timestamp }],
                  }
                : item,
            ),
            activity: addActivity(current.activity, {
              taskId,
              type: "comment" satisfies ActivityType,
              actorId: current.currentUserId,
              message: `Commented on “${task.title}”.`,
            }),
          }
        })
        toast.success("Comment added")
      },
      toggleChecklistItem: (taskId, itemId) => {
        setStore((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  updatedAt: nowIso(),
                  checklist: task.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
                }
              : task,
          ),
        }))
      },
      addChecklistItem: (taskId, title) => {
        const text = title.trim()
        if (!text) return
        setStore((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  updatedAt: nowIso(),
                  checklist: [...task.checklist, { id: createId("chk"), title: text, done: false }],
                }
              : task,
          ),
        }))
      },
      approveTask: (taskId, feedback) => {
        const timestamp = nowIso()
        setStore((current) => {
          const task = current.tasks.find((item) => item.id === taskId)
          if (!task) return current
          const review: ReviewEntry = {
            id: createId("rev"),
            reviewerId: current.currentUserId,
            outcome: "approved",
            feedback: feedback.trim() || "Approved.",
            createdAt: timestamp,
          }
          const withReview = {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === taskId ? { ...item, reviews: [...item.reviews, review] } : item,
            ),
            activity: addActivity(current.activity, {
              taskId,
              type: "review" as const,
              actorId: current.currentUserId,
              message: `Approved “${task.title}”.`,
            }),
          }
          return applyStatus(withReview, taskId, "completed")
        })
        toast.success("Task approved and marked completed")
      },
      requestRevision: (taskId, feedback) => {
        const text = feedback.trim()
        if (!text) return false
        const timestamp = nowIso()
        setStore((current) => {
          const task = current.tasks.find((item) => item.id === taskId)
          if (!task) return current
          const review: ReviewEntry = {
            id: createId("rev"),
            reviewerId: current.currentUserId,
            outcome: "revision_requested",
            feedback: text,
            createdAt: timestamp,
          }
          return {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === taskId
                ? { ...item, status: "revision_required", reviews: [...item.reviews, review], updatedAt: timestamp }
                : item,
            ),
            notifications: addNotification(current.notifications, {
              type: "revision" satisfies NotificationType,
              title: "Revisions requested",
              body: `“${task.title}” needs more work.`,
              taskId,
            }),
            activity: addActivity(current.activity, {
              taskId,
              type: "review",
              actorId: current.currentUserId,
              message: `Requested revisions on “${task.title}”.`,
            }),
          }
        })
        toast.success("Revisions requested")
        return true
      },
      resubmitForReview: (taskId, note) => {
        const timestamp = nowIso()
        setStore((current) => {
          const task = current.tasks.find((item) => item.id === taskId)
          if (!task) return current
          const review: ReviewEntry = {
            id: createId("rev"),
            reviewerId: current.currentUserId,
            outcome: "submitted",
            feedback: note.trim() || "Resubmitted for review.",
            createdAt: timestamp,
          }
          const withReview = {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === taskId ? { ...item, reviews: [...item.reviews, review], submittedForReviewAt: timestamp } : item,
            ),
          }
          return applyStatus(withReview, taskId, "in_review")
        })
        toast.success("Sent back for review")
      },
      createNextOccurrence: (taskId) => {
        const source = store.tasks.find((item) => item.id === taskId)
        if (!source || source.recurrence === "none") return null
        const dates = nextOccurrenceDates(source, today)
        if (!dates) return null
        const id = nextTaskId(store.tasks)
        const seriesId = source.seriesId ?? source.id
        const timestamp = nowIso()
        const next: Task = {
          ...source,
          id,
          status: "not_started",
          startDate: dates.startDate,
          dueDate: dates.dueDate,
          seriesId,
          previousInstanceId: source.id,
          checklist: source.checklist.map((item) => ({ ...item, id: createId("chk"), done: false })),
          reviews: [],
          comments: [],
          submittedForReviewAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          notes: source.notes
            ? `${source.notes}\n\nFollows ${source.id}.`
            : `Follows ${source.id}.`,
        }
        setStore((current) => ({
          ...current,
          tasks: [
            next,
            ...current.tasks.map((item) => (item.id === source.id ? { ...item, seriesId } : item)),
          ],
          activity: addActivity(current.activity, {
            taskId: id,
            type: "recurrence",
            actorId: current.currentUserId,
            message: `Created the next ${source.recurrence} occurrence of “${source.title}”.`,
          }),
        }))
        toast.success("Next occurrence created")
        return id
      },
      markNotificationRead: (id) =>
        setStore((current) => ({
          ...current,
          notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
        })),
      markAllNotificationsRead: () =>
        setStore((current) => ({
          ...current,
          notifications: current.notifications.map((item) => ({ ...item, read: true })),
        })),
      resetDemoData: () => {
        setStore(createDemoState())
        setForm(null)
        setPendingStatus(null)
        toast.success("Demo data restored")
      },
    }),
    [
      addActivity,
      addNotification,
      applyStatus,
      confirmStatusChange,
      currentUser,
      form,
      hydrated,
      pendingStatus,
      requestStatusChange,
      saveTask,
      store,
      today,
    ],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) throw new Error("useTasks must be used within TaskProvider")
  return context
}
