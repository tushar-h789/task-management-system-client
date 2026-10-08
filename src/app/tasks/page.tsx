import { TasksView } from "@/components/tasks/tasks-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "All Tasks" };

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading tasks…</p>}>
      <TasksView />
    </Suspense>
  );
}
