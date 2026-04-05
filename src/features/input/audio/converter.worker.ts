/* eslint-env worker */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let isLoaded = false

self.onmessage = async (event: MessageEvent<{ blob: Blob }>) => {
  try {
    if (!isLoaded) {
      self.postMessage({ loading: true, message: 'Loading audio converter…' })

      ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        console.log('[ffmpeg-worker]', message)
      })

      ffmpeg.on('progress', ({ progress, time }) => {
        self.postMessage({
          progress: true,
          message: `Converting… ${Math.round(progress * 100)}%`,
        })
      })

      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd'

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      isLoaded = true
      self.postMessage({ loading: false, message: 'Converter ready' })
    }

    if (!ffmpeg) {
      throw new Error('FFmpeg failed to initialize')
    }

    const inputBlob = event.data.blob
    const arrayBuffer = await inputBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    await ffmpeg.writeFile('input.webm', uint8Array)

    await ffmpeg.exec([
      '-i',
      'input.webm',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-f',
      'wav',
      'output.wav',
    ])

    const outputData = await ffmpeg.readFile('output.wav')
    const outputUint8 = outputData as Uint8Array

    const binary = String.fromCharCode(...outputUint8)
    const base64 = btoa(binary)

    await ffmpeg.deleteFile('input.webm')
    await ffmpeg.deleteFile('output.wav')

    self.postMessage({ success: true, base64 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error'
    console.error('[ffmpeg-worker] Conversion failed:', errorMessage)
    self.postMessage({
      success: false,
      error: errorMessage,
    })
  }
}
