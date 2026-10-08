import { Badge } from "@/components/ui/badge"
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks"
import type { Priority, TaskStatus } from "@/types"
import { cn } from "@/lib/utils"

const statusClass: Record<TaskStatus, string> = {
  not_started: "border-zinc-200 bg-zinc-100 text-zinc-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  in_review: "border-purple-200 bg-purple-50 text-purple-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
  revision_required: "border-orange-200 bg-orange-50 text-orange-800",
  completed: "border-green-200 bg-green-50 text-green-800",
}

const priorityClass: Record<Priority, string> = {
  low: "border-zinc-200 bg-zinc-50 text-zinc-700",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  urgent: "border-red-200 bg-red-50 text-red-800",
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-md", statusClass[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("rounded-md", priorityClass[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}

export function OverdueBadge() {
  return (
    <Badge variant="outline" className="rounded-md border-red-300 bg-red-50 text-red-800">
      Overdue
    </Badge>
  )
}
