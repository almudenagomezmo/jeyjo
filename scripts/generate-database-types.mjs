import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'packages/database-types/src/database.types.ts')

const types = execSync('npx supabase gen types typescript --local', {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
})

writeFileSync(outPath, types.replace(/^\uFEFF/, ''), 'utf8')
console.log(`Wrote ${outPath}`)
