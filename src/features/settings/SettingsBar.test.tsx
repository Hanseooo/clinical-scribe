/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import { SettingsBar } from './SettingsBar'
import { DEFAULT_TEMPLATE } from '@/lib/templates'
import type { TemplateId, OutputLanguage } from '@/types'

describe('SettingsBar', () => {
  const defaultProps = {
    template: DEFAULT_TEMPLATE,
    onTemplateChange: vi.fn(),
    outputLanguage: 'en' as OutputLanguage,
    onOutputLanguageChange: vi.fn(),
  }

  it('renders template selector with correct default value', () => {
    render(<SettingsBar {...defaultProps} />)

    expect(screen.getByRole('combobox', { name: /template/i })).toHaveTextContent('FDAR')
  })

  it('shows the current template as selected', () => {
    render(<SettingsBar {...defaultProps} template="sbar" />)

    expect(screen.getByRole('combobox', { name: /template/i })).toHaveTextContent('SBAR')
  })

  it('renders output language selector with English enabled', () => {
    render(<SettingsBar {...defaultProps} />)

    expect(screen.getByRole('combobox', { name: /output language/i })).toHaveTextContent('English')
  })
})
