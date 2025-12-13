import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] px-3 py-2 text-sm text-[var(--color-fg-default)] shadow-[var(--color-shadow-small)] transition-all duration-200 outline-none",
        "placeholder:text-[var(--color-fg-subtle)]",
        "focus:border-[var(--color-accent-emphasis)] focus:ring-[3px] focus:ring-[var(--color-accent-muted)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
