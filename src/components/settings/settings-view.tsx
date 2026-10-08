"use client"

import { useTasks } from "@/components/providers/task-provider"
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PRIORITY_LABELS, PRIORITY_ORDER, STATUS_LABELS, STATUS_ORDER } from "@/lib/tasks"
import { useState } from "react"

export function SettingsView() {
  const { members, currentUserId, setCurrentUserId, highlightOverdue, setHighlightOverdue, resetDemoData } = useTasks()
  const [confirmReset, setConfirmReset] = useState(false)
  const items = Object.fromEntries(members.map((member) => [member.id, `${member.name} · ${member.role}`]))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Demo user</CardTitle>
          <CardDescription>Switch the person whose tasks and reviews you are previewing. This is not a login.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Label htmlFor="demo-user">Viewing as</Label>
          <Select items={items} value={currentUserId} onValueChange={(value) => value && setCurrentUserId(value)}>
            <SelectTrigger id="demo-user" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} · {member.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Overdue tasks always include a text label. This only changes the extra highlight.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={highlightOverdue} onCheckedChange={(checked) => setHighlightOverdue(Boolean(checked))} />
            Highlight overdue tasks
          </label>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Status legend</CardTitle>
          <CardDescription>Overdue is a warning based on the due date. It is not a workflow status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <span key={status} className="inline-flex items-center gap-2 text-sm">
              <StatusBadge status={status} />
              <span className="sr-only">{STATUS_LABELS[status]}</span>
            </span>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Priority legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRIORITY_ORDER.map((priority) => (
            <span key={priority} className="inline-flex items-center gap-2 text-sm">
              <PriorityBadge priority={priority} />
              <span className="sr-only">{PRIORITY_LABELS[priority]}</span>
            </span>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
          <CardDescription>
            Your changes are saved in this browser. Restoring the sample data removes those local changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            Restore sample data
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore the sample tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              Tasks, reviews, comments, and notifications you changed in this browser will be replaced with the original demo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetDemoData()
                setConfirmReset(false)
              }}
            >
              Restore sample data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
