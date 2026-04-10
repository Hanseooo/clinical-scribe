import type { TemplateId, HandoverTemplate } from '../../types'
import { fdarTemplate } from './fdar'
import { isbarTemplate } from './isbar'
import { isobarTemplate } from './isobar'
import { sbarTemplate } from './sbar'

export const TEMPLATES: Record<TemplateId, HandoverTemplate> = {
  fdar: fdarTemplate,
  isbar: isbarTemplate,
  sbar: sbarTemplate,
  isobar: isobarTemplate,
}

export const DEFAULT_TEMPLATE: TemplateId = 'fdar'
