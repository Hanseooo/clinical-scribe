'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TranscriptSegment } from './types'

interface CorrectionPopoverProps {
  segment: TranscriptSegment
  onCorrect: (correctedText: string) => void
  trigger: React.ReactNode
}

export function CorrectionPopover({ segment, onCorrect, trigger }: CorrectionPopoverProps) {
  const [value, setValue] = useState(segment.text)
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (value.trim() && value.trim() !== segment.text) {
      onCorrect(value.trim())
    }
    setOpen(false)
  }

  const handleSelectAlternative = (alt: string) => {
    setValue(alt)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Correct transcription</PopoverTitle>
          <PopoverDescription>
            Original: “{segment.text}”
          </PopoverDescription>
        </PopoverHeader>
        <div className="space-y-3">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter corrected text..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
          {segment.alternatives.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Alternatives:</p>
              <div className="flex flex-wrap gap-1.5">
                {segment.alternatives.map((alt) => (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => handleSelectAlternative(alt)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-muted"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
