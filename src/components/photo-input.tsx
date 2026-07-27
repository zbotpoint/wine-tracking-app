import { useEffect, useMemo, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PhotoInputProps = {
  file: File | null
  onFileChange: (file: File | null) => void
  // Signed URL of the already-uploaded photo when editing.
  existingUrl?: string | null
  removeExisting?: boolean
  onRemoveExistingChange?: (remove: boolean) => void
}

export function PhotoInput({
  file,
  onFileChange,
  existingUrl,
  removeExisting = false,
  onRemoveExistingChange,
}: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const shownUrl = previewUrl ?? (removeExisting ? null : (existingUrl ?? null))

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null
          onFileChange(next)
          e.target.value = ''
        }}
      />
      {shownUrl ? (
        <div className="relative w-fit">
          <img
            src={shownUrl}
            alt="Wine photo"
            className="max-h-56 rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-1.5 right-1.5 size-7"
            aria-label="Remove photo"
            onClick={() => {
              if (previewUrl) {
                onFileChange(null)
              } else {
                onRemoveExistingChange?.(true)
              }
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="size-4" />
        {shownUrl ? 'Replace photo' : 'Add photo'}
      </Button>
    </div>
  )
}
