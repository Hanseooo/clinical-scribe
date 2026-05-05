import { rest } from 'msw'

export const handlers = [
  rest.post('/api/transcribe', (req, res, ctx) => {
    return res(
      ctx.json({
        draftTranscript: {
          segments: [
            {
              id: "seg_001",
              text: "Patient was given",
              confidence: 0.95,
              alternatives: [],
            },
            {
              id: "seg_002",
              text: "metoprolol",
              confidence: 0.62,
              alternatives: ["metformin", "metroprolol"],
              startTime: 2.5,
              endTime: 3.8,
            },
          ],
        },
        model: 'gemini-2.5-flash',
      }),
    );
  }),
]
