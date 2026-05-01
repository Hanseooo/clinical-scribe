import { NextResponse } from 'next/server'
import { uploadToGeminiFileApi, deleteFromGeminiFileApi } from '@/lib/langchain/inputAdapters'
import { transcribeAudio } from '@/lib/langchain/transcribeChain'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let fileUri: string | null = null

  try {
    const body = await request.json()
    const { audio } = body

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid audio field', code: 'INVALID_INPUT' },
        { status: 400 },
      )
    }

    const audioBuffer = Buffer.from(audio, 'base64')
    fileUri = await uploadToGeminiFileApi(audioBuffer, 'audio/wav')

    const draftTranscript = await transcribeAudio(fileUri)

    return NextResponse.json({
      draftTranscript,
      model: 'gemini-2.5-flash',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'

    if (message.includes('FORMAT_ERROR')) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', code: 'FORMAT_ERROR' },
        { status: 500 },
      )
    } else if (message.includes('Failed to upload') || message.includes('Failed to delete')) {
      return NextResponse.json(
        { error: 'File processing error', code: 'FILE_ERROR' },
        { status: 500 },
      )
    } else {
      return NextResponse.json(
        { error: message, code: 'UNKNOWN' },
        { status: 500 },
      )
    }
  } finally {
    if (fileUri) {
      await deleteFromGeminiFileApi(fileUri).catch(() => {
        // Log but don't fail the request if cleanup fails
      })
    }
  }
}
