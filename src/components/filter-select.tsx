import { useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
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
  placeholder,
  anyLabel,
  value,
  options,
  onChange,
  disabled,
}: {
  placeholder: string
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('shrink-0 justify-between font-normal', !selected && 'text-muted-foreground')}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
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
