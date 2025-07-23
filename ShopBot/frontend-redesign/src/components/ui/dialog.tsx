import * as React from "react"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div data-dialog-root>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            open: isOpen,
            onOpenChange: handleOpenChange
          })
        }
        return child
      })}
    </div>
  )
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild }) => {
  return asChild ? children : <button>{children}</button>
}

const DialogContent: React.FC<DialogContentProps & { open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  className, 
  children, 
  open, 
  onOpenChange 
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className={`relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 ${className || ''}`}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0 ${className || ''}`}>
      {children}
    </div>
  )
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}>
      {children}
    </h2>
  )
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
