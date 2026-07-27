import { useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type FilterOption = {
  value: string
  label: string
  node?: ReactNode
}

const SEARCH_THRESHOLD = 8

// A filter dropdown that stays usable with long option lists: a search box
// appears once there are enough options to scroll.
export function FilterSelect({
  label,
  anyLabel,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  anyLabel: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)
  const needle = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options),
    [options, needle],
  )

  function choose(next: string | null) {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        {/* Mirrors SelectTrigger size="sm" so filters look identical whether
            they're a native select or this searchable popover. */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-8 w-fit shrink-0 items-center justify-between gap-1.5 rounded-md border border-input bg-input/30 py-2 pr-2 pl-2.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            // Matches the native trigger's data-placeholder styling.
            !selected && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{selected?.label ?? label}</span>
          <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {options.length > SEARCH_THRESHOLD && (
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8"
            />
          </div>
        )}
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
            onClick={() => choose(null)}
          >
            <span className="flex-1 truncate">{anyLabel}</span>
            {value === null && <Check className="size-4 shrink-0" />}
          </button>
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => choose(option.value)}
            >
              <span className="flex-1 truncate">{option.node ?? option.label}</span>
              {option.value === value && <Check className="size-4 shrink-0" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No matches</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
