import { describe, it, expect } from 'vitest'
import { appendEvidenceSection, collectEvidenceSourcesForKnowledgeFiles, getAllEvidenceSources } from '@/lib/plan-evidence'

describe('collectEvidenceSourcesForKnowledgeFiles', () => {
  it('always includes core non-US-centric safety sources', () => {
    const sources = collectEvidenceSourcesForKnowledgeFiles([])
    const ids = sources.map((source) => source.id)

    expect(ids).toContain('nhs-safer-sleep')
    expect(ids).toContain('nice-postnatal-care')
    expect(ids).toContain('canada-joint-safe-sleep')
    expect(ids).toContain('aap-safe-sleep-2022')
  })

  it('adds cultural sources when cultural knowledge file is selected', () => {
    const sources = collectEvidenceSourcesForKnowledgeFiles(['cultural-considerations.txt'])
    const ids = sources.map((source) => source.id)

    expect(ids).toContain('who-postnatal-care')
    expect(ids).toContain('nice-postnatal-care')
    expect(ids).toContain('aap-safe-sleep-2022')
    expect(ids).toContain('cross-cultural-sleep-2010')
  })

  it('does not include retired light-content evidence links', () => {
    const sources = collectEvidenceSourcesForKnowledgeFiles([
      'sleep-environment.txt',
      'cultural-considerations.txt',
    ])
    const ids = sources.map((source) => source.id)

    expect(ids).not.toContain('red-nose-safe-practices')
    expect(ids).not.toContain('unicef-caring-at-night')
    expect(ids).not.toContain('who-safe-sleep')
  })
})

describe('appendEvidenceSection', () => {
  it('appends an evidence section with source links', () => {
    const plan = '# Plan\n\nMain content'
    const sources = collectEvidenceSourcesForKnowledgeFiles(['core-principles.txt'])

    const withEvidence = appendEvidenceSection(plan, sources)

    expect(withEvidence).toContain('## Evidence and Safety Sources')
    expect(withEvidence).toContain('American Academy of Pediatrics (AAP)')
    expect(withEvidence).toContain('https://publications.aap.org/')
  })

  it('does not append duplicate evidence sections', () => {
    const plan = '# Plan\n\n## Evidence and Safety Sources\n\nAlready here'
    const sources = collectEvidenceSourcesForKnowledgeFiles(['core-principles.txt'])

    const withEvidence = appendEvidenceSection(plan, sources)

    expect(withEvidence).toBe(plan)
  })
})

describe('evidence source quality guardrails', () => {
  const APPROVED_HOSTS = new Set([
    'apps.who.int',
    'www.who.int',
    'www.nhs.uk',
    'www.nice.org.uk',
    'www.canada.ca',
    'publications.aap.org',
    'www.cdc.gov',
    'pubmed.ncbi.nlm.nih.gov',
  ])

  const DISALLOWED_PATH_FRAGMENTS = ['/health-topics/', '/tools/', '/section/']

  it('uses only approved high-authority domains', () => {
    const sources = getAllEvidenceSources()

    for (const source of sources) {
      const url = new URL(source.url)
      expect(APPROVED_HOSTS.has(url.host), `${source.id} has unapproved host: ${url.host}`).toBe(true)
    }
  })

  it('does not use generic hub-style URL paths', () => {
    const sources = getAllEvidenceSources()

    for (const source of sources) {
      const lowerPath = new URL(source.url).pathname.toLowerCase()
      const hasHubPath = DISALLOWED_PATH_FRAGMENTS.some((fragment) => lowerPath.includes(fragment))
      expect(hasHubPath, `${source.id} uses generic path: ${lowerPath}`).toBe(false)
    }
  })

  it('requires source date metadata for auditability', () => {
    const sources = getAllEvidenceSources()

    for (const source of sources) {
      expect(source.organization.trim().length, `${source.id} organization missing`).toBeGreaterThan(0)
      expect(source.title.trim().length, `${source.id} title missing`).toBeGreaterThan(0)
      expect(source.publishedOrUpdatedAt).toMatch(/^\d{4}(-\d{2}){0,2}$/)
    }
  })

  it('links WHO postnatal guidance directly to the full PDF', () => {
    const source = getAllEvidenceSources().find((entry) => entry.id === 'who-postnatal-care')

    expect(source).toBeDefined()
    expect(source?.url).toMatch(/\.pdf($|\?)/)
  })
})
