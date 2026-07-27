import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type Suggestion = {
  value: string
  label: string
  hint?: string
}

type SuggestInputProps = {
  text: string
  onTextChange: (text: string) => void
  suggestions: Suggestion[]
  onPick: (suggestion: Suggestion) => void
  // Free text that matches no suggestion: offered as an "Add …" row when set.
  onCreate?: (text: string) => void
  createPrefix?: string
  // When true, text that isn't a suggestion is cleared on blur.
  matchOnly?: boolean
  // When true, free text is committed via onCreate when the input blurs.
  commitOnBlur?: boolean
  placeholder?: string
  inputMode?: 'text' | 'numeric'
  id?: string
  autoFocus?: boolean
}

export function SuggestInput({
  text,
  onTextChange,
  suggestions,
  onPick,
  onCreate,
  createPrefix = 'Add',
  matchOnly = false,
  commitOnBlur = false,
  placeholder,
  inputMode = 'text',
  id,
  autoFocus,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false)

  const needle = text.trim().toLowerCase()
  const filtered = needle
    ? suggestions.filter((s) => `${s.label} ${s.hint ?? ''}`.toLowerCase().includes(needle))
    : suggestions
  const exact = suggestions.find((s) => s.label.toLowerCase() === needle)
  const canCreate = onCreate != null && needle.length > 0 && !exact

  function pick(suggestion: Suggestion) {
    onPick(suggestion)
    setOpen(false)
  }

  function commitFreeText() {
    if (!needle) return
    if (exact) {
      pick(exact)
    } else if (onCreate) {
      onCreate(text.trim())
      setOpen(false)
    } else if (matchOnly) {
      onTextChange('')
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        autoFocus={autoFocus}
        autoComplete="off"
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => {
          onTextChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          if (matchOnly && needle && !exact) onTextChange('')
          if (matchOnly && exact) pick(exact)
          if (commitOnBlur && needle) commitFreeText()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (filtered.length > 0 && (exact || !canCreate)) {
              pick(exact ?? filtered[0])
            } else {
              commitFreeText()
            }
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && (filtered.length > 0 || canCreate) && (
        <ul
          className={cn(
            'absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto',
            'rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          )}
        >
          {filtered.map((suggestion) => (
            <li key={suggestion.value}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                // onMouseDown so the click wins the race against input blur.
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(suggestion)
                }}
              >
                <span className="flex-1 truncate">{suggestion.label}</span>
                {suggestion.hint && (
                  <span className="shrink-0 text-xs text-muted-foreground">{suggestion.hint}</span>
                )}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitFreeText()
                }}
              >
                <Plus className="size-4 shrink-0" />
                <span className="truncate">
                  {createPrefix} “{text.trim()}”
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
