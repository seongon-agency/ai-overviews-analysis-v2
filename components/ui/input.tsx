import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] px-3 py-1 text-sm text-[var(--color-fg-default)] shadow-[var(--color-shadow-small)] transition-all duration-200 outline-none",
        "placeholder:text-[var(--color-fg-subtle)]",
        "focus:border-[var(--color-accent-emphasis)] focus:ring-[3px] focus:ring-[var(--color-accent-muted)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-fg-default)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
