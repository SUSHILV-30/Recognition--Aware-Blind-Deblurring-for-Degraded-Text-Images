// Fails if the source names an image that is not in public/img. Every string
// literal ending in an image extension counts, so names passed through
// variables (figure: 'l5_comparison.png') are checked too. Plain names must
// exist exactly; template names (`grid/L${level}_x.jpg`) must match a file.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const imgDir = join(root, 'public', 'img')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const images = new Set(walk(imgDir).map((p) => relative(imgDir, p).split('\\').join('/')))
const sources = walk(join(root, 'src')).filter((p) => /\.(jsx?|tsx?)$/.test(p))

const missing = []
let checked = 0
for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/(['"`])([\w./${}-]+\.(?:png|jpe?g|webp|gif|svg))\1/g)) {
    const name = m[2]
    checked++
    const ok = name.includes('${')
      ? [...images].some((i) => new RegExp(`^${name.split(/\$\{[^}]*\}/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`).test(i))
      : images.has(name)
    if (!ok) missing.push(`${relative(root, file)}: ${name}`)
  }
}

if (missing.length) {
  console.error(`Missing images (${missing.length}):\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
console.log(`All ${checked} image references resolve to files in public/img.`)
