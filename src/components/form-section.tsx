import type { ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// An optional form field revealed by an AddFieldButton. The ✕ sits beside the
// control itself and clears the value and collapses the field.
export function FieldSection({
  label,
  htmlFor,
  onRemove,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  onRemove: () => void
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          aria-label={`Remove ${label.toLowerCase()}`}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function AddFieldButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-dashed text-muted-foreground"
      onClick={onClick}
    >
      <Plus className="size-4" />
      {label}
    </Button>
  )
}
