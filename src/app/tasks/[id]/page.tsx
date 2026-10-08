import { TaskDetailView } from "@/components/tasks/task-detail-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Task details" };

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading task…</p>}>
      <TaskRoute params={params} />
    </Suspense>
  );
}

async function TaskRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetailView taskId={id} />;
}
