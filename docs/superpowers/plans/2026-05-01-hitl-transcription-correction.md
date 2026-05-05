  # HITL Transcription Correction Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-generation transcript review step where clinical staff can correct low-confidence transcription segments before the final handover is generated.

**Architecture:** New `POST /api/transcribe` endpoint returns a structured `DraftTranscript` with phrase-level segments and confidence scores. Frontend state is managed by `useTranscriptReview` hook. Mobile-first UI uses `shadcn/ui` Sheet (mobile) and Popover (desktop) for corrections. Corrected transcript is then sent to existing `POST /api/generate?modality=text`.

**Tech Stack:** Langchain, Gemini API (JSON mode), shadcn/ui Sheet/Popover/AlertDialog, React hooks, MSW for testing.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/hitl/types.ts` | Create | Domain types: `TranscriptSegment`, `DraftTranscript`, `CorrectionMap`. |
| `src/lib/langchain/transcribeChain.ts` | Create | Langchain chain that prompts Gemini for structured JSON transcript with uncertainty markers. |
| `src/app/api/transcribe/route.ts` | Create | Next.js API route. Accepts audio, calls `transcribeChain`, returns `DraftTranscript`. |
| `src/features/hitl/useTranscriptReview.ts` | Create | Hook managing review state, corrections map, progress, and transcript reconstruction. |
| `src/features/hitl/UncertaintyBadge.tsx` | Create | Renders a phrase with amber underline + icons when confidence is low. |
| `src/features/hitl/CorrectionPopover.tsx` | Create | Desktop popover with alternatives + "Other..." input. |
| `src/features/hitl/CorrectionSheet.tsx` | Create | Mobile bottom sheet with alternatives + "Other..." input. |
| `src/features/hitl/TranscriptReviewPanel.tsx` | Create | Main container. Renders transcript segments, manages Sheet/Popover mounting, progress footer. |
| `src/app/app-client.tsx` | Modify | Add "Review" step between audio upload and handover generation. |
| `src/lib/langchain/inputAdapters.ts` | Modify | Extract and reuse `uploadToGeminiFileApi` for `/api/transcribe`. |

---

## Chunk 1: Backend — Transcription Chain and API Route

### Task 1: Create HITL Types

**Files:**
- Create: `src/features/hitl/types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/features/hitl/types.ts

export interface TranscriptSegment {
  id: string;
  text: string;
  confidence: number;
  alternatives: string[];
  startTime?: number;
  endTime?: number;
}

export interface DraftTranscript {
  segments: TranscriptSegment[];
}

export interface CorrectionMap {
  [segmentId: string]: string;
}

export interface ReviewState {
  draft: DraftTranscript;
  corrections: CorrectionMap;
  skipped: Set<string>;
  isComplete: boolean;
}

export interface TranscribeRequest {
  audio: string; // base64 WAV
  language?: 'en';
}

export interface TranscribeResponse {
  draftTranscript: DraftTranscript;
  model: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/hitl/types.ts
pnpm run lint && git commit -m "feat(hitl): add domain types for transcript review"
```

---

### Task 2: Create transcribeChain.ts

**Files:**
- Create: `src/lib/langchain/transcribeChain.ts`

- [ ] **Step 1: Implement transcribeChain**

Read `src/lib/langchain/handoverChain.ts` first to follow the existing pattern (Gemini model initialization, prompt building, parsing).

```typescript
// src/lib/langchain/transcribeChain.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { DraftTranscript, TranscriptSegment } from '@/features/hitl/types';

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash-lite',
  temperature: 0,
});

const TRANSCRIBE_SYSTEM_PROMPT = `You are a medical transcription assistant. Transcribe the following audio verbatim.

For each phrase in the transcript, assign a confidence score (0.0–1.0).
If confidence < 0.80, provide 2–3 alternative phrases that the speaker might have said.
Focus on: drug names, numbers, units, and words with similar pronunciations.

Return strict JSON matching this schema:
{
  "segments": [
    {
      "id": "seg_001",
      "text": "the full phrase text",
      "confidence": 0.95,
      "alternatives": [],
      "startTime": 0.0,
      "endTime": 2.5
    }
  ]
}

Use Filipino English and Tagalog/Bisaya code-switching context as needed.`;

function parseTranscriptOutput(raw: string): DraftTranscript {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.segments)) {
      throw new Error('Missing segments array');
    }
    return {
      segments: parsed.segments.map((seg: TranscriptSegment, index: number) => ({
        id: seg.id || `seg_${String(index).padStart(3, '0')}`,
        text: seg.text,
        confidence: seg.confidence,
        alternatives: seg.alternatives || [],
        startTime: seg.startTime,
        endTime: seg.endTime,
      })),
    };
  } catch (err) {
    // Fallback: try to extract JSON from markdown code block
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return parseTranscriptOutput(jsonMatch[1]);
    }
    throw new Error(`Failed to parse transcript JSON: ${err}`);
  }
}

export async function transcribeAudio(fileUri: string): Promise<DraftTranscript> {
  const messages = [
    new SystemMessage(TRANSCRIBE_SYSTEM_PROMPT),
    new HumanMessage({
      content: [
        { type: 'text', text: 'Transcribe this audio.' },
        { type: 'media', mimeType: 'audio/wav', fileUri },
      ],
    }),
  ];

  const response = await model.invoke(messages);
  const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  return parseTranscriptOutput(raw);
}
```

- [ ] **Step 2: Add unit test for parseTranscriptOutput**

```typescript
// src/lib/langchain/transcribeChain.test.ts
import { describe, it, expect } from 'vitest';
import { parseTranscriptOutput } from './transcribeChain';

// We need to export parseTranscriptOutput for testing, or test via transcribeAudio with mocks.
// For now, test the logic directly by exporting it.
```

Refactor `parseTranscriptOutput` to be exported, then write the test.

Run:
```bash
pnpm vitest run src/lib/langchain/transcribeChain.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/langchain/transcribeChain.ts src/lib/langchain/transcribeChain.test.ts
pnpm run lint && git commit -m "feat(hitl): add transcribeChain with Gemini JSON mode parsing"
```

---

### Task 3: Create POST /api/transcribe Route

**Files:**
- Create: `src/app/api/transcribe/route.ts`

- [ ] **Step 1: Read existing /api/generate/route.ts**

Use Read tool to inspect `src/app/api/generate/route.ts` and note error handling patterns, `maxDuration`, `uploadToGeminiFileApi` usage, and response shape.

- [ ] **Step 2: Implement /api/transcribe**

```typescript
// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/langchain/transcribeChain';
import { uploadToGeminiFileApi, deleteFromGeminiFileApi } from '@/lib/langchain/inputAdapters';
import { TranscribeResponse } from '@/features/hitl/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let fileUri: string | null = null;

  try {
    const body = await request.json();
    const { audio } = body;

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json({ error: 'FORMAT_ERROR', message: 'Audio is required.' }, { status: 400 });
    }

    // Decode base64 and upload to Gemini File API
    const audioBuffer = Buffer.from(audio, 'base64');
    fileUri = await uploadToGeminiFileApi(audioBuffer, 'audio/wav');

    const draftTranscript = await transcribeAudio(fileUri);

    const response: TranscribeResponse = {
      draftTranscript,
      model: 'gemini-2.5-flash-lite',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'TRANSCRIPTION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (fileUri) {
      try {
        await deleteFromGeminiFileApi(fileUri);
      } catch (cleanupError) {
        console.warn('Failed to cleanup Gemini file:', cleanupError);
      }
    }
  }
}
```

- [ ] **Step 3: Verify inputAdapters exports**

Ensure `uploadToGeminiFileApi` and `deleteFromGeminiFileApi` are exported from `src/lib/langchain/inputAdapters.ts`. If not, add exports.

- [ ] **Step 4: Build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/transcribe/route.ts
pnpm run lint && git commit -m "feat(api): add POST /api/transcribe endpoint"
```

---

## Chunk 2: Frontend — State Management and Review Components

### Task 4: Create useTranscriptReview Hook

**Files:**
- Create: `src/features/hitl/useTranscriptReview.ts`
- Test: `src/features/hitl/useTranscriptReview.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/hitl/useTranscriptReview.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptReview } from './useTranscriptReview';
import { DraftTranscript } from './types';

const mockDraft: DraftTranscript = {
  segments: [
    { id: 'seg_001', text: 'Patient was given', confidence: 0.95, alternatives: [] },
    { id: 'seg_002', text: 'metoprolol', confidence: 0.62, alternatives: ['metformin', 'metroprolol'] },
  ],
};

describe('useTranscriptReview', () => {
  it('initializes with draft and no corrections', () => {
    const { result } = renderHook(() => useTranscriptReview(mockDraft));
    expect(result.current.state.draft.segments).toHaveLength(2);
    expect(result.current.state.isComplete).toBe(false);
  });

  it('marks segment as corrected', () => {
    const { result } = renderHook(() => useTranscriptReview(mockDraft));
    act(() => {
      result.current.applyCorrection('seg_002', 'metformin');
    });
    expect(result.current.state.corrections['seg_002']).toBe('metformin');
    expect(result.current.state.isComplete).toBe(true);
  });
});
```

Run:
```bash
pnpm vitest run src/features/hitl/useTranscriptReview.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement hook**

```typescript
// src/features/hitl/useTranscriptReview.ts
import { useState, useCallback, useMemo } from 'react';
import { DraftTranscript, CorrectionMap, ReviewState } from './types';

export function useTranscriptReview(draft: DraftTranscript) {
  const [corrections, setCorrections] = useState<CorrectionMap>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const flaggedSegmentIds = useMemo(() => {
    return draft.segments.filter((s) => s.confidence < 0.8).map((s) => s.id);
  }, [draft]);

  const isComplete = useMemo(() => {
    return flaggedSegmentIds.every(
      (id) => corrections[id] !== undefined || skipped.has(id)
    );
  }, [flaggedSegmentIds, corrections, skipped]);

  const applyCorrection = useCallback((segmentId: string, correctedText: string) => {
    setCorrections((prev) => ({ ...prev, [segmentId]: correctedText }));
    setSkipped((prev) => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
  }, []);

  const skipSegment = useCallback((segmentId: string) => {
    setSkipped((prev) => new Set(prev).add(segmentId));
    setCorrections((prev) => {
      const next = { ...prev };
      delete next[segmentId];
      return next;
    });
  }, []);

  const reconstructTranscript = useCallback((): string => {
    return draft.segments
      .map((segment) => corrections[segment.id] || segment.text)
      .join(' ');
  }, [draft, corrections]);

  const skippedCount = useMemo(() => {
    return Array.from(skipped).filter((id) => flaggedSegmentIds.includes(id)).length;
  }, [skipped, flaggedSegmentIds]);

  const resolvedCount = useMemo(() => {
    return flaggedSegmentIds.filter(
      (id) => corrections[id] !== undefined || skipped.has(id)
    ).length;
  }, [flaggedSegmentIds, corrections, skipped]);

  const state: ReviewState = {
    draft,
    corrections,
    skipped,
    isComplete,
  };

  return {
    state,
    applyCorrection,
    skipSegment,
    reconstructTranscript,
    skippedCount,
    resolvedCount,
    totalFlagged: flaggedSegmentIds.length,
  };
}
```

- [ ] **Step 3: Run tests**

Run:
```bash
pnpm vitest run src/features/hitl/useTranscriptReview.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/hitl/useTranscriptReview.ts src/features/hitl/useTranscriptReview.test.ts
pnpm run lint && git commit -m "feat(hitl): add useTranscriptReview hook with correction state"
```

---

### Task 5: Create UncertaintyBadge Component

**Files:**
- Create: `src/features/hitl/UncertaintyBadge.tsx`

- [ ] **Step 1: Implement component**

```typescript
// src/features/hitl/UncertaintyBadge.tsx
'use client';

import { TranscriptSegment } from './types';
import { AlertTriangle, Play } from 'lucide-react';

interface UncertaintyBadgeProps {
  segment: TranscriptSegment;
  isCorrected: boolean;
  onClick: () => void;
  onPlay: () => void;
}

export function UncertaintyBadge({ segment, isCorrected, onClick, onPlay }: UncertaintyBadgeProps) {
  const isFlagged = segment.confidence < 0.8;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1 rounded ${
        isFlagged && !isCorrected
          ? 'bg-amber-50 border-b-2 border-amber-400 cursor-pointer hover:bg-amber-100'
          : isCorrected
          ? 'bg-green-50 border-b-2 border-green-400'
          : ''
      }`}
      onClick={isFlagged && !isCorrected ? onClick : undefined}
      role={isFlagged && !isCorrected ? 'button' : undefined}
      tabIndex={isFlagged && !isCorrected ? 0 : undefined}
    >
      <span>{segment.text}</span>
      {isFlagged && !isCorrected && (
        <AlertTriangle className="h-3 w-3 text-amber-500" />
      )}
      {isFlagged && isCorrected && (
        <span className="text-xs text-green-600">(corrected)</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="ml-1 text-muted-foreground hover:text-foreground"
        aria-label={`Play audio for "${segment.text}"`}
      >
        <Play className="h-3 w-3" />
      </button>
    </span>
  );
}
```

- [ ] **Step 2: Build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/hitl/UncertaintyBadge.tsx
pnpm run lint && git commit -m "feat(hitl): add UncertaintyBadge component for flagged segments"
```

---

### Task 6: Create CorrectionPopover (Desktop)

**Files:**
- Create: `src/features/hitl/CorrectionPopover.tsx`

- [ ] **Step 1: Verify shadcn/ui Popover is installed**

Run:
```bash
ls src/components/ui/popover.tsx
```

If missing, install:
```bash
npx shadcn-ui@latest add popover
```

- [ ] **Step 2: Implement CorrectionPopover**

```typescript
// src/features/hitl/CorrectionPopover.tsx
'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TranscriptSegment } from './types';

interface CorrectionPopoverProps {
  segment: TranscriptSegment;
  children: React.ReactNode;
  onCorrect: (correctedText: string) => void;
  onSkip: () => void;
}

export function CorrectionPopover({ segment, children, onCorrect, onSkip }: CorrectionPopoverProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [customText, setCustomText] = useState('');
  const [open, setOpen] = useState(false);

  const handleAlternative = (alt: string) => {
    onCorrect(alt);
    setOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onCorrect(customText.trim());
      setOpen(false);
      setIsTyping(false);
      setCustomText('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <p className="text-sm font-medium">Did you mean...</p>
          <div className="space-y-1">
            {segment.alternatives.map((alt) => (
              <Button
                key={alt}
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleAlternative(alt)}
              >
                {alt}
              </Button>
            ))}
          </div>
          {isTyping ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Type correction..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                }}
              />
              <Button size="sm" onClick={handleCustomSubmit}>
                OK
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-auto py-2 text-muted-foreground"
              onClick={() => setIsTyping(true)}
            >
              Other (type)...
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 text-muted-foreground"
            onClick={() => {
              onSkip();
              setOpen(false);
            }}
          >
            Skip
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 3: Build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/hitl/CorrectionPopover.tsx
pnpm run lint && git commit -m "feat(hitl): add CorrectionPopover for desktop transcript correction"
```

---

### Task 7: Create CorrectionSheet (Mobile)

**Files:**
- Create: `src/features/hitl/CorrectionSheet.tsx`

- [ ] **Step 1: Verify shadcn/ui Sheet is installed**

Run:
```bash
ls src/components/ui/sheet.tsx
```

If missing, install:
```bash
npx shadcn-ui@latest add sheet
```

- [ ] **Step 2: Implement CorrectionSheet**

```typescript
// src/features/hitl/CorrectionSheet.tsx
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TranscriptSegment } from './types';

interface CorrectionSheetProps {
  segment: TranscriptSegment;
  children: React.ReactNode;
  onCorrect: (correctedText: string) => void;
  onSkip: () => void;
}

export function CorrectionSheet({ segment, children, onCorrect, onSkip }: CorrectionSheetProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [customText, setCustomText] = useState('');
  const [open, setOpen] = useState(false);

  const handleAlternative = (alt: string) => {
    onCorrect(alt);
    setOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onCorrect(customText.trim());
      setOpen(false);
      setIsTyping(false);
      setCustomText('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Did you mean...</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">"{segment.text}"</p>
          <div className="space-y-2">
            {segment.alternatives.map((alt) => (
              <Button
                key={alt}
                variant="outline"
                className="w-full justify-start text-base h-14"
                onClick={() => handleAlternative(alt)}
              >
                {alt}
              </Button>
            ))}
          </div>
          {isTyping ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Type correction..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                }}
              />
              <Button size="default" onClick={handleCustomSubmit}>
                OK
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-base h-14 text-muted-foreground"
              onClick={() => setIsTyping(true)}
            >
              Other (type)...
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-base h-14 text-muted-foreground"
            onClick={() => {
              onSkip();
              setOpen(false);
            }}
          >
            Skip
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/hitl/CorrectionSheet.tsx
pnpm run lint && git commit -m "feat(hitl): add CorrectionSheet for mobile transcript correction"
```

---

### Task 8: Create TranscriptReviewPanel

**Files:**
- Create: `src/features/hitl/TranscriptReviewPanel.tsx`
- Modify: `src/app/app-client.tsx`

- [ ] **Step 1: Read current app-client.tsx**

Use Read tool to inspect `src/app/app-client.tsx` and note the current generation flow, state management, and how `handover` is set after generation.

- [ ] **Step 2: Implement TranscriptReviewPanel**

```typescript
// src/features/hitl/TranscriptReviewPanel.tsx
'use client';

import { useRef } from 'react';
import { DraftTranscript } from './types';
import { useTranscriptReview } from './useTranscriptReview';
import { UncertaintyBadge } from './UncertaintyBadge';
import { CorrectionPopover } from './CorrectionPopover';
import { CorrectionSheet } from './CorrectionSheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Play } from 'lucide-react';

interface TranscriptReviewPanelProps {
  draft: DraftTranscript;
  audioBlob: Blob;
  onComplete: (correctedTranscript: string) => void;
}

export function TranscriptReviewPanel({ draft, audioBlob, onComplete }: TranscriptReviewPanelProps) {
  const { state, applyCorrection, skipSegment, reconstructTranscript, skippedCount, resolvedCount, totalFlagged, isComplete } = useTranscriptReview(draft);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleGenerate = () => {
    if (skippedCount > 0) {
      setShowSkipConfirm(true);
    } else {
      onComplete(reconstructTranscript());
    }
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    onComplete(reconstructTranscript());
  };

  const playSegment = (startTime?: number, endTime?: number) => {
    if (!audioRef.current || startTime === undefined) return;
    audioRef.current.currentTime = startTime;
    audioRef.current.play();
    if (endTime !== undefined) {
      const stopAt = () => {
        if (audioRef.current && audioRef.current.currentTime >= endTime) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', stopAt);
        }
      };
      audioRef.current.addEventListener('timeupdate', stopAt);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} className="hidden" />
      
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
        <div>
          <h3 className="font-medium">Review Transcript</h3>
          <p className="text-sm text-muted-foreground">Tap flagged words to correct</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => audioRef.current?.play()}>
          <Play className="h-4 w-4 mr-1" />
          Replay
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 leading-relaxed">
        {state.draft.segments.map((segment) => {
          const isCorrected = state.corrections[segment.id] !== undefined;
          const correctedText = state.corrections[segment.id];

          const badge = (
            <UncertaintyBadge
              segment={segment}
              isCorrected={isCorrected}
              onClick={() => {}}
              onPlay={() => playSegment(segment.startTime, segment.endTime)}
            />
          );

          if (segment.confidence < 0.8 && !isCorrected) {
            const CorrectionWrapper = isMobile ? CorrectionSheet : CorrectionPopover;
            return (
              <CorrectionWrapper
                key={segment.id}
                segment={segment}
                onCorrect={(text) => applyCorrection(segment.id, text)}
                onSkip={() => skipSegment(segment.id)}
              >
                {badge}
              </CorrectionWrapper>
            );
          }

          return <span key={segment.id}>{badge} </span>;
        })}
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Resolved {resolvedCount} of {totalFlagged}
          </span>
          {skippedCount > 0 && (
            <span className="text-amber-600">{skippedCount} skipped</span>
          )}
        </div>
        <Button
          className="w-full"
          disabled={!isComplete}
          onClick={handleGenerate}
        >
          Generate Handover
        </Button>
      </div>

      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skipped Suggestions</AlertDialogTitle>
            <AlertDialogDescription>
              You skipped {skippedCount} suggestion(s). These may contain errors. Proceed anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSkip}>Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 3: Modify app-client.tsx to add Review step**

In `app-client.tsx`, add a new state `reviewDraft: DraftTranscript | null`. After audio upload:
1. Call `POST /api/transcribe` instead of `POST /api/generate`.
2. On success, set `reviewDraft` and show `TranscriptReviewPanel`.
3. On `onComplete(correctedTranscript)`, call `POST /api/generate` with `modality: 'text'` and `text: correctedTranscript`.

Key state additions:
```typescript
const [reviewDraft, setReviewDraft] = useState<DraftTranscript | null>(null);
const [reviewAudioBlob, setReviewAudioBlob] = useState<Blob | null>(null);
```

Key flow change in audio handler:
```typescript
// Instead of calling /api/generate directly:
const response = await fetch('/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ audio: base64Audio }),
});
const data = await response.json();
setReviewDraft(data.draftTranscript);
setReviewAudioBlob(audioBlob);
```

Render conditionally:
```typescript
{reviewDraft && reviewAudioBlob && (
  <TranscriptReviewPanel
    draft={reviewDraft}
    audioBlob={reviewAudioBlob}
    onComplete={(correctedText) => {
      setReviewDraft(null);
      // Call existing text generation with corrected transcript
      generateFromText({ text: correctedText, templateId: template });
    }}
  />
)}
```

- [ ] **Step 4: Build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/hitl/TranscriptReviewPanel.tsx src/app/app-client.tsx
pnpm run lint && git commit -m "feat(hitl): add TranscriptReviewPanel and wire into app flow"
```

---

## Chunk 3: Integration Testing

### Task 9: Mock /api/transcribe in MSW

**Files:**
- Modify: `test/setup.ts` or existing MSW handlers

- [ ] **Step 1: Add MSW handler**

```typescript
// In your MSW handlers file
import { http, HttpResponse } from 'msw';

export const handlers = [
  // ... existing handlers
  http.post('/api/transcribe', async () => {
    return HttpResponse.json({
      draftTranscript: {
        segments: [
          { id: 'seg_001', text: 'Patient was given', confidence: 0.95, alternatives: [] },
          { id: 'seg_002', text: 'metoprolol', confidence: 0.62, alternatives: ['metformin', 'metroprolol'], startTime: 2.5, endTime: 3.8 },
        ],
      },
      model: 'gemini-2.5-flash-lite',
    });
  }),
];
```

- [ ] **Step 2: Write integration test**

```typescript
// src/features/hitl/__tests__/TranscriptReviewPanel.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranscriptReviewPanel } from '../TranscriptReviewPanel';
import { DraftTranscript } from '../types';

const mockDraft: DraftTranscript = {
  segments: [
    { id: 'seg_001', text: 'Patient was given', confidence: 0.95, alternatives: [] },
    { id: 'seg_002', text: 'metoprolol', confidence: 0.62, alternatives: ['metformin', 'metroprolol'], startTime: 2.5, endTime: 3.8 },
  ],
};

const mockBlob = new Blob(['mock-audio'], { type: 'audio/wav' });

describe('TranscriptReviewPanel integration', () => {
  it('allows selecting an alternative and completing review', async () => {
    const handleComplete = vi.fn();
    render(
      <TranscriptReviewPanel
        draft={mockDraft}
        audioBlob={mockBlob}
        onComplete={handleComplete}
      />
    );

    // Flagged word should be visible
    expect(screen.getByText('metoprolol')).toBeInTheDocument();

    // Click flagged word
    await userEvent.click(screen.getByText('metoprolol'));

    // Select alternative
    await userEvent.click(screen.getByText('metformin'));

    // Generate button should now be enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Handover/i })).toBeEnabled();
    });

    await userEvent.click(screen.getByRole('button', { name: /Generate Handover/i }));

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith('Patient was given metformin');
    });
  });
});
```

Run:
```bash
pnpm vitest run src/features/hitl/__tests__/TranscriptReviewPanel.integration.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/handlers.ts src/features/hitl/__tests__/TranscriptReviewPanel.integration.test.tsx
pnpm run lint && git commit -m "test(hitl): add integration test for transcript review flow"
```

---

## Plan Review Checklist

- [ ] All new files have exact paths and clear responsibilities.
- [ ] `/api/generate` contract is unchanged; legacy audio flow still works.
- [ ] `useTranscriptReview` hook is fully tested.
- [ ] Mobile Sheet and Desktop Popover are both implemented.
- [ ] Skip confirmation uses `shadcn/ui AlertDialog`.
- [ ] Audio replay is wired via `<audio>` ref with segment seeking.
- [ ] MSW mocks the new `/api/transcribe` endpoint.
- [ ] Build and lint pass after every commit.

**Plan complete and saved to `docs/superpowers/plans/2026-05-01-hitl-transcription-correction.md`. Ready to execute?**