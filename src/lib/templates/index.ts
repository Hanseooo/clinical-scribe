import type { TemplateId, HandoverTemplate } from '../../types'
import { isbarTemplate } from './isbar'
import { isobarTemplate } from './isobar'
import { sbarTemplate } from './sbar'

export const TEMPLATES: Record<TemplateId, HandoverTemplate> = {
  isbar: isbarTemplate,
  sbar: sbarTemplate,
  isobar: isobarTemplate,
}

export const DEFAULT_TEMPLATE: TemplateId = 'isbar'
