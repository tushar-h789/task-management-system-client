"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/tasks"
import { useTasks } from "@/components/providers/task-provider"
import type { TaskStatus } from "@/types"

const items = Object.fromEntries(STATUS_ORDER.map((status) => [status, STATUS_LABELS[status]]))

export function StatusSelect({
  taskId,
  status,
  label = "Change status",
}: {
  taskId: string
  status: TaskStatus
  label?: string
}) {
  const { requestStatusChange } = useTasks()

  return (
    <Select
      items={items}
      value={status}
      onValueChange={(value) => {
        if (!value || value === status) return
        requestStatusChange(taskId, value as TaskStatus)
      }}
    >
      <SelectTrigger aria-label={label} className="w-full min-w-36 bg-card" onClick={(event) => event.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_ORDER.map((item) => (
          <SelectItem key={item} value={item}>
            {STATUS_LABELS[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
