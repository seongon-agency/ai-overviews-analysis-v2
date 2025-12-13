import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-emphasis)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-btn-bg)] text-[var(--color-fg-default)] border border-[var(--color-btn-border)] shadow-[var(--color-shadow-small)] hover:bg-[var(--color-btn-hover-bg)] hover:border-[var(--color-border-default)] active:bg-[var(--color-btn-active-bg)]",
        primary:
          "bg-[var(--color-btn-primary-bg)] text-white border border-transparent hover:bg-[var(--color-btn-primary-hover-bg)]",
        destructive:
          "text-[var(--color-danger-fg)] bg-[var(--color-btn-bg)] border border-[var(--color-btn-border)] hover:bg-[var(--color-danger-emphasis)] hover:text-white hover:border-[var(--color-danger-emphasis)]",
        outline:
          "border border-[var(--color-border-default)] bg-transparent text-[var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)]",
        secondary:
          "bg-[var(--color-canvas-subtle)] text-[var(--color-fg-default)] border border-[var(--color-border-default)] hover:bg-[var(--color-btn-hover-bg)]",
        ghost:
          "text-[var(--color-fg-default)] hover:bg-[var(--color-neutral-muted)]",
        link: "text-[var(--color-accent-fg)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
