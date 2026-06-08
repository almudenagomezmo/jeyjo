import type { Crumb } from '@/components/ui/Breadcrumb'

import type { NavNode } from './fetch-navigation-tree'

/** Walks the navigation tree and returns slug segments from root to the target node. */
export function findCategorySlugPathInTree(
  tree: NavNode[],
  targetSlug: string,
  path: string[] = [],
): string[] | null {
  for (const node of tree) {
    const nextPath = [...path, node.slug]
    if (node.slug === targetSlug) return nextPath
    const found = findCategorySlugPathInTree(node.children, targetSlug, nextPath)
    if (found) return found
  }
  return null
}

export function buildBreadcrumbsFromCategorySlugs(
  tree: NavNode[],
  categorySlugs: string[],
): Crumb[] {
  let bestPath: string[] | null = null

  for (const slug of categorySlugs) {
    const path = findCategorySlugPathInTree(tree, slug)
    if (path && (!bestPath || path.length > bestPath.length)) {
      bestPath = path
    }
  }

  if (!bestPath?.length) {
    return buildBreadcrumbsFromPath(tree, '/')
  }

  return buildBreadcrumbsFromPath(tree, `/c/${bestPath.join('/')}`)
}

export function buildBreadcrumbsFromPath(tree: NavNode[], pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Inicio', href: '/' }]
  const path = pathname.split('?')[0] ?? pathname

  if (path === '/search' || path.startsWith('/search/')) {
    crumbs.push({ label: 'Buscar' })
    return crumbs
  }

  if (!path.startsWith('/c/')) {
    return crumbs
  }

  const slugs = path
    .replace(/^\/c\/?/, '')
    .split('/')
    .filter(Boolean)

  let currentLevel = tree
  let href = '/c'

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const node = currentLevel.find((n) => n.slug === slug)
    if (!node) break

    href += `/${slug}`
    // Always include href; Breadcrumb only links non-leaf items (current page stays plain text).
    crumbs.push({ label: node.title, href })
    currentLevel = node.children
  }

  return crumbs
}

export function appendCrumb(crumbs: Crumb[], label: string): Crumb[] {
  return [...crumbs, { label }]
}
