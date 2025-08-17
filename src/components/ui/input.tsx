import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-violet-400 selection:bg-violet-500 selection:text-white dark:bg-input/30 border-violet-200 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-violet-800 text-violet-700 dark:text-violet-700 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-[invert(35%)_sepia(15%)_saturate(5000%)_hue-rotate(260deg)] dark:[&::-webkit-calendar-picker-indicator]:filter-[invert(70%)_sepia(10%)_saturate(4000%)_hue-rotate(265deg)] hover:[&::-webkit-calendar-picker-indicator]:opacity-70",
        "focus-visible:border-violet-500 focus-visible:ring-violet-400/30 focus-visible:ring-[3px]",
        "hover:border-violet-400 dark:hover:border-violet-600",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
