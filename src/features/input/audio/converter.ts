export function convertToWavBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./converter.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<{ success: boolean; base64?: string; error?: string }>) => {
      worker.terminate()

      if (event.data.success && event.data.base64) {
        resolve(event.data.base64)
      } else {
        reject(new Error(event.data.error ?? 'Audio conversion failed'))
      }
    }

    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }

    worker.postMessage({ blob })
  })
}
