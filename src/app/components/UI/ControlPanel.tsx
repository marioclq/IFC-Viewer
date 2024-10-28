'use client'

interface ControlPanelProps {
  isVisible?: boolean;
  children?: React.ReactNode;
}

export function ControlPanel({ isVisible = true, children }: ControlPanelProps) {
  if (!isVisible) return null;
  
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}