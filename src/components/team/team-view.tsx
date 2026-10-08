"use client"

import { useTasks } from "@/components/providers/task-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { MemberAvatar } from "@/components/shared/member-avatar"
import { StatusBadge } from "@/components/tasks/task-badges"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { activeTasks, dueLabel } from "@/lib/tasks"
import Link from "next/link"
import { useMemo, useState } from "react"

export function TeamView() {
  const { members, tasks } = useTasks()
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("all")
  const roles = useMemo(() => [...new Set(members.map((member) => member.role))], [members])
  const roleItems = { all: "All roles", ...Object.fromEntries(roles.map((item) => [item, item])) }
  const openCounts = members.map((member) => activeTasks(tasks).filter((task) => task.assigneeId === member.id).length)
  const maxOpen = Math.max(1, ...openCounts)
  const visible = members.filter((member) => {
    const needle = query.trim().toLowerCase()
    const matchesQuery = !needle || `${member.name} ${member.role} ${member.email}`.toLowerCase().includes(needle)
    return matchesQuery && (role === "all" || member.role === role)
  })

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" aria-label="Search team members" />
        <Select items={roleItems} value={role} onValueChange={(value) => setRole(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Open tasks show current workload. They are not a measure of performance.
      </p>
      {visible.length === 0 ? (
        <EmptyState title="No one matches" description="Try another name or role." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((member) => {
            const open = activeTasks(tasks).filter((task) => task.assigneeId === member.id).length
            const completed = tasks.filter((task) => task.assigneeId === member.id && task.status === "completed").length
            return (
              <Link key={member.id} href={`/team/${member.id}`}>
                <Card className="h-full shadow-sm transition-colors hover:border-primary/40">
                  <CardContent className="grid gap-3 pt-4">
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={member.name} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      {open} open tasks · {completed} completed
                    </p>
                    <Progress value={(open / maxOpen) * 100} aria-label={`${open} open tasks`} />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MemberTasksView({ memberId }: { memberId: string }) {
  const { members, tasks, today } = useTasks()
  const member = members.find((item) => item.id === memberId)
  const assigned = tasks.filter((task) => task.assigneeId === memberId)

  if (!member) {
    return <EmptyState title="Teammate not found" description="Choose someone from the team directory." />
  }

  return (
    <div className="grid gap-4">
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <MemberAvatar name={member.name} size="lg" />
          <div>
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="text-sm text-muted-foreground">
              {member.role} · {member.email}
            </p>
          </div>
        </CardContent>
      </Card>
      {assigned.length === 0 ? (
        <EmptyState title="No tasks assigned" description={`${member.name} does not have any tasks in this demo.`} />
      ) : (
        <div className="grid gap-3">
          {assigned.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="block font-medium">{task.title}</span>
                <span className="text-sm text-muted-foreground">{dueLabel(task, today)}</span>
              </span>
              <StatusBadge status={task.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
