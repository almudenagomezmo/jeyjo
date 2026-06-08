type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

function collectPlainText(node: LexicalNode | undefined, parts: string[]): void {
  if (!node) return
  if (node.type === 'text' && node.text) {
    parts.push(node.text)
  }
  for (const child of node.children ?? []) {
    collectPlainText(child, parts)
  }
}

export function extractPlainTextFromLexical(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: LexicalNode }).root
  if (!root) return ''
  const parts: string[] = []
  collectPlainText(root, parts)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function buildExcerpt(
  excerpt: string | null | undefined,
  content: unknown,
  maxLength = 160,
): string {
  const manual = excerpt?.trim()
  if (manual) return manual.length <= maxLength ? manual : `${manual.slice(0, maxLength - 1)}…`

  const plain = extractPlainTextFromLexical(content)
  if (!plain) return ''
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength - 1)}…`
}
