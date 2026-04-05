/* eslint-env worker */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

self.onmessage = async (event: MessageEvent<{ blob: Blob }>) => {
  try {
    if (!ffmpeg) {
      ffmpeg = new FFmpeg()

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
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
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    })
  }
}
