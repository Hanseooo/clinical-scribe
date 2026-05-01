import { describe, it, expect } from 'vitest'
import { parseTranscriptOutput } from './transcribeChain'

describe('parseTranscriptOutput', () => {
  it('parses valid JSON', () => {
    const valid = {
      segments: [
        { id: '1', text: 'hello', confidence: 0.9, alternatives: ['halo'], startTime: 0, endTime: 1 },
      ],
    }
    expect(parseTranscriptOutput(JSON.stringify(valid))).toEqual(valid)
  })

  it('parses JSON inside markdown code blocks', () => {
    const valid = {
      segments: [
        { id: '1', text: 'hello', confidence: 0.9, alternatives: ['halo'] },
      ],
    }
    const markdown = `\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``
    expect(parseTranscriptOutput(markdown)).toEqual(valid)
  })

  it('throws for invalid JSON', () => {
    expect(() => parseTranscriptOutput('not json')).toThrow()
  })

  it('throws for missing segments array', () => {
    expect(() => parseTranscriptOutput('{"foo":"bar"}')).toThrow('FORMAT_ERROR')
  })
})
