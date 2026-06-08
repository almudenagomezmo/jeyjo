import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Field } from 'payload'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: path.join(cmsRoot, '.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')

function walk(fields: Field[], prefix = ''): string[] {
  const names: string[] = []
  for (const field of fields) {
    if ('name' in field && field.name) {
      names.push(`${prefix}${field.name}`)
    }
    if ('fields' in field && field.fields) {
      names.push(...walk(field.fields, `${prefix}  `))
    }
    if ('tabs' in field && field.tabs) {
      for (const tab of field.tabs) {
        const label = 'label' in tab && tab.label ? String(tab.label) : 'tab'
        names.push(...walk(tab.fields ?? [], `${prefix}[${label}] `))
      }
    }
  }
  return names
}

const payload = await getPayload({ config })
const collection = payload.collections.products.config
const names = walk(collection.fields)
const related = names.filter((n) => n.includes('relatedProducts'))
console.log('relatedProducts paths:', related)
console.log('duplicate count:', related.length)
