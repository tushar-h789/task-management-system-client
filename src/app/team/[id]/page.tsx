import { MemberTasksView } from "@/components/team/team-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Team member" };

export default function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading team member…</p>}>
      <MemberRoute params={params} />
    </Suspense>
  );
}

async function MemberRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemberTasksView memberId={id} />;
}
