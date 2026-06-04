import { describe, expect, it } from 'vitest'

import { lexicalToSanitizedHtml } from '@/lib/cms/lexical-to-html'

describe('lexicalToSanitizedHtml', () => {
  it('strips script tags from output', () => {
    const html = lexicalToSanitizedHtml({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: '<script>alert(1)</script>Seguro', version: 1 },
            ],
            version: 1,
          },
        ],
        version: 1,
      },
    })
    expect(html).not.toContain('<script')
    expect(html).toContain('Seguro')
  })
})
