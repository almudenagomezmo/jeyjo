import { lexicalToSanitizedHtml } from '@/lib/cms/lexical-to-html'

interface SitePageContentProps {
  content: unknown
}

export function SitePageContent({ content }: SitePageContentProps) {
  const html = lexicalToSanitizedHtml(content)

  return (
    <article
      className="prose prose-neutral dark:prose-invert max-w-3xl prose-headings:font-semibold prose-a:text-brand"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
