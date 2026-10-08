import { MyTasksView } from "@/components/my-tasks/my-tasks-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Tasks" };

export default function MyTasksPage() {
  return <MyTasksView />;
}
