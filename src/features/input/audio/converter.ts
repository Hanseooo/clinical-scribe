interface WorkerMessage {
  success?: boolean
  base64?: string
  error?: string
  loading?: boolean
  progress?: boolean
  message?: string
}

export function convertToWavBase64(
  blob: Blob,
  onProgress?: (message: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./converter.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data

      if (data.loading) {
        onProgress?.(data.message ?? 'Loading…')
        return
      }

      if (data.progress) {
        onProgress?.(data.message ?? 'Converting…')
        return
      }

      if (data.success && data.base64) {
        worker.terminate()
        resolve(data.base64)
      } else if (data.error) {
        worker.terminate()
        reject(new Error(data.error))
      }
    }

    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }

    worker.postMessage({ blob })
  })
}
