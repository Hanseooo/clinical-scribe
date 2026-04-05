'use client'

import { Document, Page, Text, View } from '@react-pdf/renderer'
import { MdToPdf } from './mdToPdf'
import { styles } from './styles'

interface ClinicalDocumentProps {
  handover: string
  source: string
  modality: string
  model: string
  date: string
}

export function ClinicalDocumentPdf({ handover, source, modality, model, date }: ClinicalDocumentProps) {
  return (
    <Document title="Clinical Handover" author="ClinicalScribe" subject={`Clinical handover — ${modality}`}>
      <Page size="A4" style={styles.page}>
        {/* Fixed header */}
        <View fixed style={styles.header}>
          <Text>ClinicalScribe — AI-generated clinical handover</Text>
        </View>

        {/* Fixed footer with page numbers */}
        <Text
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
          style={styles.footer}
        />

        {/* Document title */}
        <Text style={styles.title}>Clinical Handover Document</Text>
        <Text style={styles.meta}>
          Model: {model} | {modality === 'text' ? 'Text notes' : 'Audio transcription'} | {date}
        </Text>

        {/* Source/Transcript section */}
        <Text style={styles.h2}>
          {modality.startsWith('audio') ? 'Transcript' : 'Source Text'}
        </Text>
        <Text style={styles.source}>{source}</Text>

        {/* Handover content (parsed markdown) */}
        <MdToPdf markdown={handover} />

        {/* Disclaimer */}
        <View style={styles.disclaimer} fixed={false}>
          <Text>
            AI-generated draft. All values marked [VERIFY] must be verified before clinical use.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
