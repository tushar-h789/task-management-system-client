import type { Recurrence } from "@/types"

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date"
  return parseISODate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function daysUntil(isoDate: string, today: string) {
  const start = parseISODate(today).getTime()
  const end = parseISODate(isoDate).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function shiftDate(isoDate: string, recurrence: Exclude<Recurrence, "none">) {
  const date = parseISODate(isoDate || toISODate(new Date()))
  if (recurrence === "daily") date.setDate(date.getDate() + 1)
  if (recurrence === "weekly") date.setDate(date.getDate() + 7)
  if (recurrence === "monthly") date.setMonth(date.getMonth() + 1)
  return toISODate(date)
}

export function buildMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const weeks: Date[][] = []

  for (let week = 0; week < 6; week += 1) {
    const days: Date[] = []
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + week * 7 + day)
      days.push(date)
    }
    weeks.push(days)
  }

  return weeks
}
