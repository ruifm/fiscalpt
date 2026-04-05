#!/usr/bin/env node

/**
 * Compares coverage against tracked thresholds in .coverage-thresholds.json.
 * - Warns (but does NOT fail) if coverage drops.
 * - Ratchets thresholds upward if coverage improved.
 * Always exits 0 — coverage changes are informational, not blocking.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const summaryPath = resolve(root, 'coverage', 'coverage-summary.json')
const thresholdsPath = resolve(root, '.coverage-thresholds.json')

let summary
try {
  summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))
} catch {
  console.error('⚠ No coverage-summary.json found. Run tests with --coverage first.')
  process.exit(0)
}

const totals = summary.total
const actual = {
  statements: totals.statements.pct,
  branches: totals.branches.pct,
  functions: totals.functions.pct,
  lines: totals.lines.pct,
}

let current
try {
  current = JSON.parse(readFileSync(thresholdsPath, 'utf-8'))
} catch {
  console.log('No .coverage-thresholds.json found — creating from current coverage.')
  const initial = {}
  for (const [key, pct] of Object.entries(actual)) {
    initial[key] = Math.floor(pct)
  }
  writeFileSync(thresholdsPath, JSON.stringify(initial, null, 2) + '\n')
  console.log('Created .coverage-thresholds.json ✓')
  process.exit(0)
}

let improved = false
let dropped = false
const next = { ...current }

for (const [key, pct] of Object.entries(actual)) {
  const floored = Math.floor(pct)
  if (floored > current[key]) {
    console.log(`  ↑ ${key}: ${current[key]}% → ${floored}%  (actual: ${pct.toFixed(2)}%)`)
    next[key] = floored
    improved = true
  } else if (floored < current[key]) {
    console.warn(`  ⚠ ${key} dropped: ${current[key]}% → ${floored}%  (actual: ${pct.toFixed(2)}%)`)
    dropped = true
  }
}

if (improved) {
  writeFileSync(thresholdsPath, JSON.stringify(next, null, 2) + '\n')
  console.log('Ratcheted .coverage-thresholds.json ✓')
} else if (dropped) {
  console.warn('Coverage decreased — review the changes above.')
} else {
  console.log('Coverage thresholds unchanged.')
}
