import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-3 py-2 text-xs",
        lg: "h-11 px-4 py-3",
        xl: "h-12 px-4 py-3 text-base",
      },
      variant: {
        default: "border-input focus-visible:border-primary",
        error: "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500",
        success: "border-success-500 focus-visible:border-success-500 focus-visible:ring-success-500",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    size, 
    variant, 
    label, 
    error, 
    success, 
    icon, 
    iconPosition = "left", 
    helperText,
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    const hasError = !!error
    const hasSuccess = !!success
    const currentVariant = hasError ? "error" : hasSuccess ? "success" : variant

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({ size, variant: currentVariant }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className
            )}
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              success ? `${inputId}-success` : 
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={`${inputId}-error`}
            className="text-sm text-error-500 flex items-center gap-1"
            role="alert"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {success && (
          <p 
            id={`${inputId}-success`}
            className="text-sm text-success-500 flex items-center gap-1"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </p>
        )}
        
        {helperText && !error && !success && (
          <p 
            id={`${inputId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
