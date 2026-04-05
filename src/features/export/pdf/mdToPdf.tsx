'use client'

import { Text, View } from '@react-pdf/renderer'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Content, Paragraph, Heading, List, ListItem, Blockquote, Code, Strong, Emphasis, Text as MdText, Link, Image, Html, InlineCode, Delete, PhrasingContent } from 'mdast'
import { styles } from './styles'

interface MdToPdfProps {
  markdown: string
}

function renderInline(node: PhrasingContent | undefined): React.ReactNode {
  if (!node) return null

  switch (node.type) {
    case 'text': {
      const t = node as MdText
      return renderVerifyText(t.value)
    }
    case 'strong': {
      const s = node as Strong
      return (
        <Text style={styles.strong}>
          {s.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'emphasis': {
      const e = node as Emphasis
      return (
        <Text style={styles.emphasis}>
          {e.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'inlineCode': {
      const ic = node as InlineCode
      return <Text style={styles.code}>{ic.value}</Text>
    }
    case 'delete': {
      const d = node as Delete
      return (
        <Text style={{ textDecoration: 'line-through' }}>
          {d.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'link': {
      const l = node as Link
      return (
        <Text style={{ color: '#0369a1', textDecoration: 'underline' }}>
          {l.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'image': {
      const img = node as Image
      return <Text style={{ color: '#666', fontStyle: 'italic' }}>[Image: {img.alt}]</Text>
    }
    case 'break':
      return '\n'
    default:
      return null
  }
}

function renderVerifyText(text: string): React.ReactNode {
  const verifyRegex = /\[VERIFY:\s*([^\]]+)\]/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = verifyRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <Text key={`verify-${match.index}`} style={styles.verify}>
        [VERIFY: {match[1]}]
      </Text>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

function renderListItems(items: Content[]): React.ReactNode[] {
  return items.map((item: Content, idx: number) => {
    const li = item as ListItem
    const children = li.children.map((child: Content, i: number) => {
      if (child.type === 'paragraph') {
        const p = child as Paragraph
        return (
          <Text key={i} style={styles.listItem}>
            {p.children.map((c: PhrasingContent, j: number) => (
              <Text key={j}>{renderInline(c)}</Text>
            ))}
          </Text>
        )
      }
      if (child.type === 'list') {
        const nested = child as List
        return (
          <View key={i} style={{ marginLeft: 12 }}>
            {renderListItems(nested.children)}
          </View>
        )
      }
      return null
    })

    return (
      <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
        <Text style={{ fontSize: 11, marginRight: 4 }}>•</Text>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    )
  })
}

function renderOrderedListItems(items: Content[]): React.ReactNode[] {
  return items.map((item: Content, idx: number) => {
    const li = item as ListItem
    const children = li.children.map((child: Content, i: number) => {
      if (child.type === 'paragraph') {
        const p = child as Paragraph
        return (
          <Text key={i} style={styles.orderedItem}>
            {p.children.map((c: PhrasingContent, j: number) => (
              <Text key={j}>{renderInline(c)}</Text>
            ))}
          </Text>
        )
      }
      if (child.type === 'list') {
        const nested = child as List
        return (
          <View key={i} style={{ marginLeft: 12 }}>
            {renderListItems(nested.children)}
          </View>
        )
      }
      return null
    })

    return (
      <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
        <Text style={{ fontSize: 11, marginRight: 4, minWidth: 16, textAlign: 'right' }}>
          {idx + 1}.
        </Text>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    )
  })
}

function renderNode(node: Content, index: number): React.ReactNode {
  switch (node.type) {
    case 'heading': {
      const h = node as Heading
      const style = h.depth === 1 ? styles.h1 : h.depth === 2 ? styles.h2 : styles.h3
      return (
        <Text key={index} style={style}>
          {h.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'paragraph': {
      const p = node as Paragraph
      return (
        <Text key={index} style={styles.body}>
          {p.children.map((child: PhrasingContent, i: number) => (
            <Text key={i}>{renderInline(child)}</Text>
          ))}
        </Text>
      )
    }
    case 'list': {
      const l = node as List
      return (
        <View key={index} style={styles.list}>
          {l.ordered ? renderOrderedListItems(l.children) : renderListItems(l.children)}
        </View>
      )
    }
    case 'blockquote': {
      const bq = node as Blockquote
      return (
        <View key={index} style={styles.blockquote}>
          {bq.children.map((child: Content, i: number) => renderNode(child, i))}
        </View>
      )
    }
    case 'thematicBreak':
      return <View key={index} style={styles.hr} />
    case 'code': {
      const c = node as Code
      return (
        <Text key={index} style={styles.code}>
          {c.value}
        </Text>
      )
    }
    case 'html': {
      const h = node as Html
      return <Text key={index} style={styles.body}>{h.value}</Text>
    }
    default:
      return null
  }
}

export function MdToPdf({ markdown }: MdToPdfProps) {
  const tree = remark().use(remarkGfm).parse(markdown)

  return (
    <View>
      {(tree.children as Content[]).map((node: Content, index: number) => renderNode(node, index))}
    </View>
  )
}
