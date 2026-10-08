"use client"

import { AppShell } from "@/components/layout/app-shell"
import { TaskProvider } from "@/components/providers/task-provider"
import { TaskFormDialog } from "@/components/tasks/task-form-dialog"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { Suspense, type ReactNode } from "react"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <TooltipProvider>
        <TaskProvider>
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading workspace…</div>}>
            <AppShell>{children}</AppShell>
            <TaskFormDialog />
          </Suspense>
          <Toaster position="top-right" />
        </TaskProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
