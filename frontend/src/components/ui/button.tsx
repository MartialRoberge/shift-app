import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anthracite-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-anthracite-900 text-white hover:bg-anthracite-800 active:bg-anthracite-700 active:scale-[0.98]",
        secondary: "bg-transparent text-anthracite-900 border border-anthracite-200 hover:bg-anthracite-50 hover:border-anthracite-300 active:bg-anthracite-100 active:scale-[0.98]",
        ghost: "bg-transparent text-anthracite-500 hover:text-anthracite-900 hover:bg-anthracite-50 active:bg-anthracite-100",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
        link: "text-anthracite-900 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-6 rounded-lg",
        xl: "h-14 px-8 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
