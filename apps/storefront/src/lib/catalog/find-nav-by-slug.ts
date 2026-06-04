import type { NavNode } from '@/lib/catalog/fetch-navigation-tree'

export function findNavNodeBySlug(tree: NavNode[], slug: string): NavNode | null {
  for (const node of tree) {
    if (node.slug === slug) return node
    const child = findNavNodeBySlug(node.children, slug)
    if (child) return child
  }
  return null
}
