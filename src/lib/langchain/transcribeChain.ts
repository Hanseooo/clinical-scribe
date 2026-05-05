import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { DraftTranscript } from '@/features/hitl/types'

let cachedModel: ChatGoogleGenerativeAI | null = null

function getModel(): ChatGoogleGenerativeAI {
  if (!cachedModel) {
    cachedModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      temperature: 0,
      apiKey: process.env.GEMINI_API_KEY,
      maxRetries: 0,
    });
  }
  return cachedModel
}

function buildSystemPrompt(): string {
  return `You are a medical transcription assistant specialized in clinical documentation.

Your task is to transcribe audio recordings into structured JSON format with high accuracy.

CRITICAL RULES:
- Focus especially on drug names, numbers, dosages, and units.
- The speaker may use Filipino English, Tagalog, or Bisaya. Understand and transcribe accurately.
- Return the result as a JSON object with a "segments" array.
- Each segment must have: id (string), text (string), confidence (number 0-1), alternatives (string array), startTime (number, optional), endTime (number, optional).
- If a word or phrase is unclear, provide the best transcription and include alternatives.
- Do not add any commentary or explanation outside the JSON.`
}

export function parseTranscriptOutput(raw: string): DraftTranscript {
  let jsonString = raw.trim()

  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim()
  }

  const parsed = JSON.parse(jsonString)

  if (!parsed.segments || !Array.isArray(parsed.segments)) {
    throw new Error('FORMAT_ERROR: Missing or invalid segments array')
  }

  return parsed as DraftTranscript
}

export async function transcribeAudio(fileUri: string): Promise<DraftTranscript> {
  const model = getModel()
  const chain = model.pipe(new StringOutputParser())

  const systemMessage = new SystemMessage(buildSystemPrompt())
  const humanMessage = new HumanMessage({
    content: [
      { type: 'text', text: 'Transcribe the attached audio into the required JSON format.' },
      {
        type: 'media',
        mimeType: 'audio/wav',
        fileUri: fileUri,
      } as { type: 'media'; mimeType: string; fileUri: string },
    ],
  })

  let raw: string
  try {
    raw = await chain.invoke([systemMessage, humanMessage])
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown Gemini response error')
    let aiError = error.message
    if ('cause' in error && error.cause) aiError += '\nCaused by: ' + JSON.stringify(error.cause)
    throw new Error(`FORMAT_ERROR: LLM error: ${aiError}`)
  }

  return parseTranscriptOutput(raw)
}
