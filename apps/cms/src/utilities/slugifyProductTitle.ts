import { toKebabCase } from '@/utilities/toKebabCase'

export function slugifyProductTitle(title: string): string {
  return toKebabCase(
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim(),
  )
}
