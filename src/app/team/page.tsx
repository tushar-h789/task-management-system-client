import { TeamView } from "@/components/team/team-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Members" };

export default function TeamPage() {
  return <TeamView />;
}
