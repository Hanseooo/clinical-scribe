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
    console.log('SafetyHighlighter: processing string:', children.slice(0, 50))
    const segments = highlightText(children)
    console.log('SafetyHighlighter: found segments:', segments.length, segments.filter(s => s.type === 'mark').length, 'marks')
    if (segments.length === 0 || segments.every(s => s.type === 'text')) {
      return children
    }
    const result = segments.map((segment, i) => {
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
    return result
  }
  if (Array.isArray(children)) {
    console.log('SafetyHighlighter: got array, mapping...')
    return children.map((child, i) => highlightChildren(child))
  }
  console.log('SafetyHighlighter: not a string or array, type:', typeof children, Array.isArray(children) ? 'array' : 'not-array')
  return children
}

function SectionHeading({ level, children }: { level: number; children?: ReactNode }) {
  const tags = ['h1', 'h2', 'h3'] as const
  const sizes = {
    1: 'text-xl font-bold tracking-tight text-slate-900 mb-3 mt-6',
    2: 'text-lg font-semibold text-slate-800 mb-2 mt-5',
    3: 'text-base font-medium text-slate-700 mb-1 mt-4',
  }
  const tag = level >= 1 && level <= 3 ? tags[level - 1] : 'h2'
  const sizeClass = level >= 1 && level <= 3 ? sizes[level as keyof typeof sizes] : sizes[2]
  return createElement(tag, { className: sizeClass }, children)
}

export function SafetyHighlighter({ markdown }: SafetyHighlighterProps) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => createElement(SectionHeading, { level: 1 }, children),
        h2: ({ children }) => createElement(SectionHeading, { level: 2 }, children),
        h3: ({ children }) => createElement(SectionHeading, { level: 3 }, children),
        p: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('p', props, highlightChildren(children)),
        li: ({ children, ...props }: { children?: ReactNode; className?: string }) =>
          createElement('li', { ...props, className: `${props.className || ''} mb-1`.trim() }, highlightChildren(children)),
        td: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('td', props, highlightChildren(children)),
        th: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('th', props, highlightChildren(children)),
        strong: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('strong', props, highlightChildren(children)),
        em: ({ children, ...props }: { children?: ReactNode }) =>
          createElement('em', props, highlightChildren(children)),
        code: ({ children, ...props }: { children?: ReactNode; className?: string }) =>
          createElement('code', props, highlightChildren(children)),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}
