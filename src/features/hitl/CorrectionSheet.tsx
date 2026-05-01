'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TranscriptSegment } from './types'

interface CorrectionSheetProps {
  segment: TranscriptSegment
  onCorrect: (correctedText: string) => void
  trigger: React.ReactNode
}

export function CorrectionSheet({ segment, onCorrect, trigger }: CorrectionSheetProps) {
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Correct transcription</SheetTitle>
          <SheetDescription>Original: “{segment.text}”</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
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
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Confirm
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
