import sanitizeHtml from 'sanitize-html'

type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  format?: number
  children?: LexicalNode[]
  listType?: string
  url?: string
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapFormatted(text: string, format?: number): string {
  let out = escapeText(text)
  if (format != null) {
    if (format & 1) out = `<strong>${out}</strong>`
    if (format & 2) out = `<em>${out}</em>`
  }
  return out
}

function renderNode(node: LexicalNode): string {
  const type = node.type ?? ''
  const children = (node.children ?? []).map(renderNode).join('')

  switch (type) {
    case 'root':
      return children
    case 'paragraph':
      return children ? `<p>${children}</p>` : ''
    case 'heading': {
      const tag = node.tag === 'h3' || node.tag === 'h4' ? node.tag : 'h2'
      return children ? `<${tag}>${children}</${tag}>` : ''
    }
    case 'text':
      return node.text != null ? wrapFormatted(node.text, node.format) : ''
    case 'linebreak':
      return '<br />'
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return children ? `<${tag}>${children}</${tag}>` : ''
    }
    case 'listitem':
      return children ? `<li>${children}</li>` : ''
    case 'link':
      if (node.url) {
        const href = escapeText(node.url)
        return `<a href="${href}" rel="noopener noreferrer">${children || href}</a>`
      }
      return children
    default:
      return children
  }
}

/** Convert Payload Lexical JSON to sanitized HTML for PDP description tab. */
export function lexicalToSanitizedHtml(state: unknown): string {
  if (!state || typeof state !== 'object') return ''

  const root = (state as { root?: LexicalNode }).root
  if (!root) return ''

  const raw = renderNode({ type: 'root', children: root.children ?? [] })
  return sanitizeHtml(raw, SANITIZE_OPTIONS).trim()
}
