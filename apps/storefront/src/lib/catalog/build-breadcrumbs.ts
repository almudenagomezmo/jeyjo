import type { Crumb } from '@/components/ui/Breadcrumb'

import type { NavNode } from './fetch-navigation-tree'

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
    const isLast = i === slugs.length - 1
    crumbs.push(isLast ? { label: node.title } : { label: node.title, href })
    currentLevel = node.children
  }

  return crumbs
}

export function appendCrumb(crumbs: Crumb[], label: string): Crumb[] {
  return [...crumbs, { label }]
}
