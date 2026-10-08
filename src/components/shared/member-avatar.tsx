import { initials } from "@/lib/tasks"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const tones = [
  "bg-blue-100 text-blue-800",
  "bg-sky-100 text-sky-800",
  "bg-indigo-100 text-indigo-800",
  "bg-slate-200 text-slate-800",
  "bg-cyan-100 text-cyan-800",
]

export function MemberAvatar({ name, size = "default" }: { name: string; size?: "sm" | "default" | "lg" }) {
  const tone = tones[name.length % tones.length]
  return (
    <Avatar size={size} aria-hidden>
      <AvatarFallback className={cn("font-medium", tone)}>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
