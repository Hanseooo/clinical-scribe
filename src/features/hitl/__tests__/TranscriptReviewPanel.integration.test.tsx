import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranscriptReviewPanel } from '../TranscriptReviewPanel'
import type { DraftTranscript } from '../types'

const mockDraft: DraftTranscript = {
  segments: [
    { id: 'seg_001', text: 'Patient was given', confidence: 0.95, alternatives: [] },
    { id: 'seg_002', text: 'metoprolol', confidence: 0.62, alternatives: ['metformin', 'metroprolol'], startTime: 2.5, endTime: 3.8 },
  ],
}

const mockBlob = new Blob(['mock-audio'], { type: 'audio/wav' })

describe('TranscriptReviewPanel integration', () => {
  it('allows selecting an alternative and completing review', async () => {
    const handleComplete = vi.fn()
    render(
      <TranscriptReviewPanel
        draft={mockDraft}
        audioBlob={mockBlob}
        onComplete={handleComplete}
      />
    )

    // Flagged word should be visible
    expect(screen.getByText('metoprolol')).toBeInTheDocument()

    // Click flagged word to open correction popover/sheet
    await userEvent.click(screen.getByText('metoprolol'))

    // Select alternative
    await userEvent.click(screen.getByText('metformin'))

    // Confirm the correction
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Continue button should now be enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    })

    // Click Continue to open confirmation dialog
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // Click Continue in the confirmation dialog
    const dialog = screen.getByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith('Patient was given metformin')
    })
  })
})
