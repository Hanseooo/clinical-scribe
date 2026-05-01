import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import type { ChainInput, ChainOutput } from './inputAdapters'

interface AudioChainInput {
  audioFileUri: string
  template: ChainInput['template']
  outputLanguage: ChainInput['outputLanguage']
}

interface TextChainInput {
  text: string
  template: ChainInput['template']
  outputLanguage: ChainInput['outputLanguage']
}

let cachedModel: ChatGoogleGenerativeAI | null = null

function getModel(): ChatGoogleGenerativeAI {
  if (!cachedModel) {
    cachedModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
    })
  }
  return cachedModel
}

function buildAudioPrompt(input: AudioChainInput): string {
  return `You are a clinical documentation assistant helping nursing students create structured handover documents from verbal recordings.

Your job is to:
1. Transcribe the audio recording accurately
2. Structure the content into a clinical handover document using the specified format
3. Flag any values that are unclear, ambiguous, or potentially misheard

CRITICAL RULES:
- Only include information explicitly stated in the audio. Never infer, assume, or fabricate clinical values.
- If a section has no relevant information from the audio, write exactly: "Not mentioned in handover."
- If any number, dosage, unit, time, or clinical value is unclear or potentially misheard, output it as: [UNCLEAR: your_best_guess]
- If you are certain a value was clearly stated, output it as-is — do not add [UNCLEAR] unnecessarily.
- All numbers and units must be written exactly as spoken. Do not round, convert, or normalise.
- Be concise. Clinical handovers should be brief and factual, not narrative.
- The speaker may have a Filipino English accent. Prioritise clinical context when interpreting unclear words.
- Output language: English only.

OUTPUT FORMAT (mandatory — do not deviate):
You must output exactly two sections separated by these exact delimiters:

TRANSCRIPT:
[raw verbatim transcript of the audio]

HANDOVER:
[structured markdown handover document]

---

${input.template.sectionInstructions}`
}

function buildTextPrompt(input: TextChainInput): string {
  return `You are a clinical documentation assistant helping nursing students create structured handover documents from typed notes.

Your job is to:
1. Structure the provided text into a clinical handover document using the specified format
2. Flag any values that are unclear, ambiguous, or potentially incomplete

CRITICAL RULES:
- Only include information explicitly stated in the source text. Never infer, assume, or fabricate clinical values.
- If a section has no relevant information, write exactly: "Not mentioned in handover."
- If any number, dosage, unit, time, or clinical value is unclear, output it as: [UNCLEAR: your_best_guess]
- All numbers and units must be written exactly as provided. Do not round, convert, or normalise.
- Be concise. Clinical handovers should be brief and factual, not narrative.
- Output language: English only.

OUTPUT FORMAT (mandatory — do not deviate):
You must output exactly two sections separated by these exact delimiters:

SOURCE:
[echo of the submitted source text]

HANDOVER:
[structured markdown handover document]

---

Source text to structure:
${input.text}

---

${input.template.sectionInstructions}`
}

function parseAudioOutput(raw: string): ChainOutput {
  const transcriptEndIndex = raw.indexOf('HANDOVER:')
  if (transcriptEndIndex === -1) {
    throw new Error('FORMAT_ERROR: Missing HANDOVER delimiter in response')
  }

  const transcript = raw
    .substring(raw.indexOf('TRANSCRIPT:') + 'TRANSCRIPT:'.length, transcriptEndIndex)
    .trim()

  const handover = raw.substring(transcriptEndIndex + 'HANDOVER:'.length).trim()

  return { source: transcript, handover }
}

function parseTextOutput(raw: string, inputText: string): ChainOutput {
  const handoverIndex = raw.indexOf('HANDOVER:')
  if (handoverIndex === -1) {
    throw new Error('FORMAT_ERROR: Missing HANDOVER delimiter in response')
  }

  const handover = raw.substring(handoverIndex + 'HANDOVER:'.length).trim()

  return { source: inputText, handover }
}

import { HumanMessage } from '@langchain/core/messages'

export async function generateFromAudio(input: AudioChainInput): Promise<ChainOutput> {
  const prompt = buildAudioPrompt(input)
  const model = getModel()
  const chain = model.pipe(new StringOutputParser())
  
  const message = new HumanMessage({
    content: [
      { type: 'text', text: prompt },
      {
        type: 'media',
        mimeType: 'audio/wav',
        fileUri: input.audioFileUri,
      } as { type: 'media'; mimeType: string; fileUri: string },
    ]
  })

  let raw: string
  try {
    raw = await chain.invoke([message])
  } catch (err: unknown) {
    // Try to extract Gemini/model-specific error message
    const error = err instanceof Error ? err : new Error('Unknown Gemini response error')
    let aiError = error.message
    if ('cause' in error && error.cause) aiError += '\nCaused by: ' + JSON.stringify(error.cause)
    throw new Error(`FORMAT_ERROR: LLM error: ${aiError}`)
  }
  return parseAudioOutput(raw)
}


export async function generateFromText(input: TextChainInput): Promise<ChainOutput> {
  const prompt = buildTextPrompt(input)
  const model = getModel()

  const chain = model.pipe(new StringOutputParser())

  const raw = await chain.invoke(prompt)

  return parseTextOutput(raw, input.text)
}
