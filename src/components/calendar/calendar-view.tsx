"use client"

import { useTasks } from "@/components/providers/task-provider"
import { StatusBadge } from "@/components/tasks/task-badges"
import { Button } from "@/components/ui/button"
import { buildMonthGrid, formatMonth, toISODate } from "@/lib/dates"
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/tasks"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function CalendarView() {
  const { tasks, today } = useTasks()
  const [year, month] = today.split("-").map(Number)
  const [cursor, setCursor] = useState({ year: year ?? 2026, month: (month ?? 1) - 1 })
  const weeks = buildMonthGrid(cursor.year, cursor.month)
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  function move(delta: number) {
    const date = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: date.getFullYear(), month: date.getMonth() })
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{formatMonth(cursor.year, cursor.month)}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCursor({ year: year ?? 2026, month: (month ?? 1) - 1 })}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => move(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            {weekday.map((day) => (
              <div key={day} className="px-2 py-2">
                {day}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0]?.toISOString()} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((date) => {
                const iso = toISODate(date)
                const inMonth = date.getMonth() === cursor.month
                const due = tasks.filter((task) => task.dueDate === iso)
                const starting = tasks.filter((task) => task.startDate === iso && task.dueDate !== iso)
                return (
                  <div key={iso} className={`min-h-28 border-r p-2 last:border-r-0 ${inMonth ? "" : "bg-muted/30 text-muted-foreground"}`}>
                    <p className={`text-xs font-medium ${iso === today ? "text-primary" : ""}`}>
                      {date.getDate()}
                      {iso === today ? <span className="sr-only"> today</span> : null}
                    </p>
                    <div className="mt-1 grid gap-1">
                      {due.slice(0, 3).map((task) => (
                        <Link key={task.id} href={`/tasks/${task.id}`} className="truncate rounded-md bg-primary/10 px-1.5 py-1 text-xs hover:bg-primary/20" title={`${task.title} · ${STATUS_LABELS[task.status]}`}>
                          {task.title}
                        </Link>
                      ))}
                      {starting.slice(0, 1).map((task) => (
                        <Link key={`${task.id}-start`} href={`/tasks/${task.id}`} className="truncate rounded-md border px-1.5 py-1 text-xs" title={`Starts: ${task.title}`}>
                          Starts: {task.title}
                        </Link>
                      ))}
                      {due.length > 3 ? <p className="text-xs text-muted-foreground">+{due.length - 3} more</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
