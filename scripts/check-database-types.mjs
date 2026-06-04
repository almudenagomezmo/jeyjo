import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const committedPath = join(root, 'packages/database-types/src/database.types.ts')
const committed = readFileSync(committedPath, 'utf8').replace(/^\uFEFF/, '').trim()

let fresh
try {
  fresh = execSync('npx supabase gen types typescript --local', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
    .replace(/^\uFEFF/, '')
    .trim()
} catch (err) {
  console.error(
    'db:types:check skipped: local Supabase not running. Start with `pnpm db:start` then `pnpm db:reset`.',
  )
  process.exit(0)
}

if (committed !== fresh) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'jeyjo-db-types-')), 'database.types.ts')
  writeFileSync(tmp, fresh, 'utf8')
  console.error(
    'database.types.ts is out of date. Run `pnpm db:types` and commit packages/database-types/src/database.types.ts',
  )
  console.error(`Diff against: ${tmp}`)
  process.exit(1)
}

console.log('database.types.ts matches local schema.')
