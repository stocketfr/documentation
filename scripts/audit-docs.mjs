import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsRoot = path.join(root, 'docs')
const markdownFiles = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(filePath)
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      markdownFiles.push(filePath)
    }
  }
}

walk(docsRoot)

const toPosix = (filePath) => filePath.split(path.sep).join('/')
const fromRoot = (filePath) => toPosix(path.relative(root, filePath))
const englishFiles = markdownFiles.filter(
  (filePath) => !filePath.endsWith('.fr.md'),
)
const frenchFiles = markdownFiles.filter((filePath) =>
  filePath.endsWith('.fr.md'),
)
const errors = []

for (const filePath of englishFiles) {
  const counterpart = filePath.replace(/\.md$/, '.fr.md')
  if (!fs.existsSync(counterpart)) errors.push(`Missing FR: ${fromRoot(filePath)}`)
}

for (const filePath of frenchFiles) {
  const counterpart = filePath.replace(/\.fr\.md$/, '.md')
  if (!fs.existsSync(counterpart)) errors.push(`Missing EN: ${fromRoot(filePath)}`)
}

function structureFor(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  const headings = []
  let fences = 0
  let tableRows = 0
  let openFence

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      fences += 1
      const marker = fenceMatch[1]
      if (!openFence) {
        openFence = marker
      } else if (
        marker[0] === openFence[0] &&
        marker.length >= openFence.length
      ) {
        openFence = undefined
      }
      continue
    }
    if (openFence) continue

    const headingMatch = line.match(/^(#{1,6}) /)
    if (headingMatch) headings.push(headingMatch[1].length)
    if (/^\|(?:.*\|)+\s*$/.test(line)) tableRows += 1
  }

  return {
    headings,
    fences,
    tableRows,
  }
}

for (const filePath of markdownFiles) {
  const contents = fs.readFileSync(filePath, 'utf8')
  const structure = structureFor(filePath)
  if (!contents.trim()) errors.push(`Empty page: ${fromRoot(filePath)}`)
  if (structure.headings.filter((level) => level === 1).length !== 1) {
    errors.push(`Page must contain exactly one H1: ${fromRoot(filePath)}`)
  }
  if (structure.fences % 2 !== 0) {
    errors.push(`Unbalanced code fence: ${fromRoot(filePath)}`)
  }
}

for (const filePath of englishFiles) {
  const counterpart = filePath.replace(/\.md$/, '.fr.md')
  if (!fs.existsSync(counterpart)) continue

  const english = structureFor(filePath)
  const french = structureFor(counterpart)
  if (JSON.stringify(english.headings) !== JSON.stringify(french.headings)) {
    errors.push(`Heading structure differs: ${fromRoot(filePath)}`)
  }
  if (english.fences !== french.fences) {
    errors.push(`Code-fence parity differs: ${fromRoot(filePath)}`)
  }
  if (english.tableRows !== french.tableRows) {
    errors.push(`Table-row parity differs: ${fromRoot(filePath)}`)
  }
}

const linkFiles = [...markdownFiles, path.join(root, 'README.md')].filter(
  fs.existsSync,
)
for (const filePath of linkFiles) {
  const contents = fs.readFileSync(filePath, 'utf8')
  const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g
  for (const match of contents.matchAll(markdownLink)) {
    let target = match[1].trim()
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1)
    }
    target = target.split(/\s+["']/)[0]
    if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue

    target = decodeURIComponent(target.split('#')[0].split('?')[0])
    if (!target) continue
    if (!fs.existsSync(path.resolve(path.dirname(filePath), target))) {
      errors.push(`Broken link: ${fromRoot(filePath)} -> ${match[1]}`)
    }
  }
}

const mkdocs = fs.readFileSync(path.join(root, 'mkdocs.yml'), 'utf8')
const navStart = mkdocs.indexOf('\nnav:')
const navText = navStart >= 0 ? mkdocs.slice(navStart) : ''
const navPaths = Array.from(
  navText.matchAll(/(?:^|\s)([A-Za-z0-9_./-]+\.md)(?:\s|$)/gm),
  (match) => match[1],
)
const navSet = new Set(navPaths)
const englishPaths = englishFiles.map((filePath) =>
  toPosix(path.relative(docsRoot, filePath)),
)

for (const navPath of navSet) {
  if (!fs.existsSync(path.join(docsRoot, navPath))) {
    errors.push(`Missing nav target: ${navPath}`)
  }
  if (!englishPaths.includes(navPath)) {
    errors.push(`Nav target is not an English source page: ${navPath}`)
  }
}

for (const englishPath of englishPaths) {
  if (!navSet.has(englishPath)) {
    errors.push(`English page absent from nav: ${englishPath}`)
  }
}

if (navPaths.length !== navSet.size) errors.push('Duplicate nav page path')

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    JSON.stringify(
      {
        markdownFiles: markdownFiles.length,
        englishPages: englishFiles.length,
        frenchPages: frenchFiles.length,
        navPages: navSet.size,
        pageIntegrity: 'ok',
        relativeLinks: 'ok',
        localeStructure: 'ok',
      },
      null,
      2,
    ),
  )
}
