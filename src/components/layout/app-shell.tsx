"use client"

import { AppHeader } from "@/components/layout/app-header"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useTasks } from "@/components/providers/task-provider"
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
import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode }) {
  const { pendingStatus, confirmStatusChange, cancelStatusChange } = useTasks()

  return (
    <div className="flex h-dvh min-h-0 bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto bg-muted/40">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(open) => !open && cancelStatusChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change this status?</AlertDialogTitle>
            <AlertDialogDescription>{pendingStatus?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current status</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Change status</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
