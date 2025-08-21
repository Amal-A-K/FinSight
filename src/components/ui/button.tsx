import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-xs hover:bg-violet-700 focus-visible:ring-violet-400/50 dark:bg-violet-700 dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400/30",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-400/50 dark:bg-red-700/90 dark:hover:bg-red-600/90 dark:focus-visible:ring-red-400/30",
        outline:
          "border border-violet-300 bg-transparent text-violet-700 shadow-xs hover:bg-violet-50 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-900/50 dark:focus-visible:ring-violet-400/30",
        secondary:
          "bg-violet-100 text-violet-900 shadow-xs hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:hover:bg-violet-900/50 dark:focus-visible:ring-violet-400/30",
        ghost:
          "text-violet-700 hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-900/50 dark:focus-visible:ring-violet-400/30",
        link: "text-violet-700 underline-offset-4 hover:underline dark:text-violet-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
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
