import fs from 'fs'
import path from 'path'

const cache = new Map<string, string | null>()
const knowledgeDir = path.join(process.cwd(), 'src/data/knowledge')

function loadFile(filename: string): string | null {
  if (cache.has(filename)) return cache.get(filename)!
  try {
    const content = fs.readFileSync(path.join(knowledgeDir, filename), 'utf-8')
    cache.set(filename, content)
    return content
  } catch {
    cache.set(filename, null)
    return null
  }
}

export function loadFreeKnowledgeBase(
  ageMonths: number,
  mainIssue: string | null
): { content: string; loadedFiles: string[] } {
  const files: string[] = ['core-principles.txt', 'bedtime-routines.txt']

  // Age-appropriate file
  if (ageMonths < 4) {
    files.push('age-0-3-months.txt')
  } else if (ageMonths < 6) {
    files.push('age-4-6-months.txt')
  } else if (ageMonths < 9) {
    files.push('age-6-9-months.txt')
  } else if (ageMonths < 12) {
    files.push('age-9-12-months.txt')
  } else if (ageMonths < 18) {
    files.push('age-12-18-months.txt')
  } else if (ageMonths < 24) {
    files.push('age-18-24-months.txt')
  } else if (ageMonths < 36) {
    files.push('age-24-36-months.txt')
  } else {
    files.push('age-36-60-months.txt')
  }

  // Issue-specific file
  if (mainIssue) {
    if (mainIssue.includes('night waking')) {
      files.push('problems-night-wakings.txt')
    } else if (mainIssue.includes('bedtime') || mainIssue.includes('hard to settle')) {
      files.push('problems-bedtime-resistance.txt')
    } else if (mainIssue.includes('early waking')) {
      files.push('problems-early-waking.txt')
    } else if (mainIssue.includes('short nap')) {
      files.push('problems-short-naps.txt')
    } else if (mainIssue.includes('nap resistance') || mainIssue.includes('won\'t nap')) {
      files.push('problems-falling-asleep.txt')
    }
  }

  // Nap transition ages
  if (ageMonths >= 12 && ageMonths <= 20) {
    files.push('nap-transitions.txt')
  }

  const unique = [...new Set(files)]
  let content = ''
  const loadedFiles: string[] = []

  for (const file of unique) {
    const text = loadFile(file)
    if (text) {
      content += `\n\n--- ${file} ---\n${text}`
      loadedFiles.push(file)
    }
  }

  return { content, loadedFiles }
}
