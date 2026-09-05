"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={internalRef}
          checked={checked ?? false}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded border border-warm-300 bg-warm-50 transition-colors",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-warm-500 peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            checked && "bg-warm-600 border-warm-600 text-warm-50",
            className
          )}
        >
          {checked && (
            <Check className="w-full h-full p-0.5" strokeWidth={3} />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
