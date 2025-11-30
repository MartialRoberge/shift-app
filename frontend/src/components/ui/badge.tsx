import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-anthracite-900",
        secondary: "text-anthracite-500",
        success: "text-anthracite-900",
        warning: "text-anthracite-600",
        destructive: "text-red-600",
        outline: "text-anthracite-600 border border-anthracite-200 rounded-md px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Status dot component
function StatusDot({ active = false, className }: { active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full",
        active ? "bg-anthracite-900" : "bg-anthracite-300",
        className
      )}
    />
  )
}

export { Badge, StatusDot, badgeVariants }
