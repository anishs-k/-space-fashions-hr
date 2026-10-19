import * as React from "react"
import { Calendar } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn, formatDateValue, normalizeDate } from "@/lib/utils"

interface DateInputProps {
  /** Stored value, YYYY-MM-DD */
  value?: string
  /** Called with YYYY-MM-DD, or '' when cleared */
  onChange: (iso: string) => void
  onBlur?: () => void
  /** Earliest date allowed in the calendar, YYYY-MM-DD */
  min?: string
  className?: string
  "aria-invalid"?: boolean
}

/**
 * Date field that always shows DD/Mon/YYYY (e.g. 19/Jun/2012),
 * whatever the browser or OS date format is. Accepts typed dates
 * (19/Jun/2012, 19/06/2012, 19-06-2012 …) or a pick from the calendar.
 */
function DateInput({ value, onChange, onBlur, min, className, "aria-invalid": ariaInvalid }: DateInputProps) {
  const [text, setText] = React.useState(() => formatDateValue(value))
  const [focused, setFocused] = React.useState(false)
  const pickerRef = React.useRef<HTMLInputElement>(null)

  // Keep the visible text in sync with outside changes (form reset, prefill)
  React.useEffect(() => {
    if (!focused) setText(formatDateValue(value))
  }, [value, focused])

  const commit = (raw: string) => {
    if (!raw.trim()) {
      onChange('')
      setText('')
      return
    }
    const iso = normalizeDate(raw)
    if (iso) {
      onChange(iso)
      setText(formatDateValue(iso))
    } else {
      // Unreadable input: go back to the last valid date
      setText(formatDateValue(value))
    }
  }

  const openPicker = () => {
    const picker = pickerRef.current
    if (!picker) return
    try {
      picker.showPicker()
    } catch {
      picker.focus()
      picker.click()
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={text}
        placeholder="DD/Mon/YYYY"
        aria-invalid={ariaInvalid}
        onFocus={() => setFocused(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => {
          setFocused(false)
          commit(e.target.value)
          onBlur?.()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit(e.currentTarget.value)
          }
        }}
        className={cn("pr-8", className)}
      />
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        aria-label="Open calendar"
        className="absolute right-0 top-0 h-full px-2 flex items-center opacity-50 hover:opacity-100 print:hidden"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
      {/* Native picker used only for its calendar popup; never shown */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        value={normalizeDate(value)}
        onChange={(e) => commit(e.target.value)}
        className="absolute right-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  )
}

export { DateInput }
