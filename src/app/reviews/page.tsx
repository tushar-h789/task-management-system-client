import { ReviewsView } from "@/components/reviews/reviews-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Task Reviews" };

export default function ReviewsPage() {
  return <ReviewsView />;
}
