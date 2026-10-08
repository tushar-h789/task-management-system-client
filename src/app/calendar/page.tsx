import { CalendarView } from "@/components/calendar/calendar-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return <CalendarView />;
}
