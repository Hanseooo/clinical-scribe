import { pdf } from '@react-pdf/renderer'
import { ClinicalDocumentPdf } from './pdf/ClinicalDocument'

interface ExportPdfOptions {
  handover: string
  source: string
  modality: string
  model: string
  date: string
}

export async function exportPdf(options: ExportPdfOptions): Promise<void> {
  const { handover, source, modality, model, date } = options

  const blob = await pdf(
    <ClinicalDocumentPdf
      handover={handover}
      source={source}
      modality={modality}
      model={model}
      date={date}
    />,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `handover-${date}.pdf`
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
