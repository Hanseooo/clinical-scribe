import { NextResponse } from 'next/server'
import { TEMPLATES } from '@/lib/templates'
import { adaptRequest } from '@/lib/langchain/inputAdapters'
import { generateFromAudio, generateFromText } from '@/lib/langchain/handoverChain'
import { deleteFromGeminiFileApi } from '@/lib/langchain/inputAdapters'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { modality, audioBase64, text, template: templateId, outputLanguage } = body

    if (!modality || !templateId || !outputLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: modality, template, outputLanguage', code: 'UNKNOWN' },
        { status: 400 },
      )
    }

    const template = TEMPLATES[templateId as keyof typeof TEMPLATES]
    if (!template) {
      return NextResponse.json(
        { error: `Unknown template: ${templateId}`, code: 'UNKNOWN' },
        { status: 400 },
      )
    }

    const chainInput = await adaptRequest(
      { modality, audioBase64, text, template: templateId, outputLanguage },
      template,
    )

    let result: { source: string; handover: string }

    if (chainInput.modality === 'text') {
      result = await generateFromText({
        text: chainInput.text!,
        template: chainInput.template,
        outputLanguage: chainInput.outputLanguage,
      })
    } else {
      try {
        result = await generateFromAudio({
          audioFileUri: chainInput.audioFileUri!,
          template: chainInput.template,
          outputLanguage: chainInput.outputLanguage,
        })
      } finally {
        if (chainInput.audioFileUri) {
          await deleteFromGeminiFileApi(chainInput.audioFileUri).catch(() => {
            // Log but don't fail the request if cleanup fails
          })
        }
      }
    }

    return NextResponse.json({
      source: result.source,
      handover: result.handover,
      modality: chainInput.modality,
      model: 'gemini-2.5-flash-lite',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    // Gemini debugging: surface full error, if present
    if (message.includes('GeminiError:')) {
      return NextResponse.json(
        { error: 'Gemini API upload failure', code: 'GEMINI_UPLOAD_ERROR', gemini: message },
        { status: 500 },
      );
    }
    if (message.includes('FORMAT_ERROR')) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', code: 'FORMAT_ERROR' },
        { status: 500 },
      );
    } else if (message.includes('Failed to upload') || message.includes('Failed to delete')) {
      return NextResponse.json(
        { error: 'File processing error', code: 'FORMAT_ERROR' },
        { status: 500 },
      );
    } else if (message.includes('Text modality requires text')) {
      return NextResponse.json(
        { error: 'No text content provided', code: 'NO_CONTENT' },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: message, code: 'UNKNOWN' },
        { status: 500 },
      );
    }
  }
}
