'use client'

import ReactMarkdown from 'react-markdown'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { highlightText } from './highlighter'

interface SafetyHighlighterProps {
  markdown: string
}

function createHighlightedElements(text: string): ReactElement[] {
  const segments = highlightText(text)

  return segments.map((segment, i) => {
    if (segment.type === 'mark') {
      return createElement(
        'mark',
        {
          key: i,
          className: `rounded-sm px-0.5 ${
            segment.className === 'warn-unit'
              ? 'bg-amber-100 text-amber-900'
              : segment.className === 'warn-time'
                ? 'bg-yellow-100 text-yellow-900'
                : segment.className === 'warn-verify'
                  ? 'bg-red-100 text-red-900'
                  : 'bg-yellow-50 text-yellow-800'
          }`,
        },
        segment.content,
      )
    }
    return createElement('span', { key: i }, segment.content)
  })
}

function highlightChildren(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return createHighlightedElements(children)
  }
  return children
}

export function SafetyHighlighter({ markdown }: SafetyHighlighterProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('p', props, highlightChildren(children)),
        li: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('li', props, highlightChildren(children)),
        td: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('td', props, highlightChildren(children)),
        th: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('th', props, highlightChildren(children)),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}
