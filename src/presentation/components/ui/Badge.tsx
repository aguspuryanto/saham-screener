import * as React from "react"
import { cn } from "../../../utils/cn"

export interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "outline"
  children?: React.ReactNode
  className?: string
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80": variant === "default",
          "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25": variant === "success",
          "border-transparent bg-amber-500/15 text-amber-700 hover:bg-amber-500/25": variant === "warning",
          "border-transparent bg-red-500/15 text-red-700 hover:bg-red-500/25": variant === "danger",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200": variant === "neutral",
          "text-slate-950": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}
