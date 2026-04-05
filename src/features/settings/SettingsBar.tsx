'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TEMPLATES } from '@/lib/templates'
import type { TemplateId, OutputLanguage } from '@/types'

interface SettingsBarProps {
  template: TemplateId
  onTemplateChange: (template: TemplateId) => void
  outputLanguage: OutputLanguage
  onOutputLanguageChange: (language: OutputLanguage) => void
}

export function SettingsBar({
  template,
  onTemplateChange,
  outputLanguage,
  onOutputLanguageChange,
}: SettingsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        <label htmlFor="template-select" className="text-sm font-medium text-slate-700">
          Template
        </label>
        <Select value={template} onValueChange={onTemplateChange}>
          <SelectTrigger id="template-select" className="w-[160px]" aria-label="Template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TEMPLATES).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
        <label htmlFor="language-select" className="text-sm font-medium text-slate-700">
          Output
        </label>
        <Select value={outputLanguage} onValueChange={onOutputLanguageChange}>
          <SelectTrigger id="language-select" className="w-[160px]" aria-label="Output language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fil" disabled>
              Filipino — Tagalog (Coming soon)
            </SelectItem>
            <SelectItem value="auto" disabled>
              Auto-detect (Coming soon)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
