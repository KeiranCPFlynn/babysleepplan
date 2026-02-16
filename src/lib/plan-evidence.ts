export interface EvidenceSource {
  id: string
  organization: string
  title: string
  url: string
  publishedOrUpdatedAt: string
}

const EVIDENCE_SOURCE_ORDER = [
  'nhs-safer-sleep',
  'nice-postnatal-care',
  'canada-joint-safe-sleep',
  'aap-safe-sleep-2022',
  'cdc-safe-sleep',
  'who-postnatal-care',
  'who-breastfeeding',
  'nhs-sleep-patterns',
  'canada-safe-sleep-tips',
  'mindell-behavioral-2006',
  'gradisar-rct-2016',
  'price-followup-2012',
  'mindell-bedtime-routine-2009',
  'mindell-bedtime-routine-2015',
  'cross-cultural-sleep-2010',
] as const

const BASE_EVIDENCE_SOURCE_IDS = [
  'nhs-safer-sleep',
  'nice-postnatal-care',
  'canada-joint-safe-sleep',
  'aap-safe-sleep-2022',
] as const

const MAX_EVIDENCE_SOURCES = 10

const EVIDENCE_SOURCES: Record<string, EvidenceSource> = {
  'who-postnatal-care': {
    id: 'who-postnatal-care',
    organization: 'World Health Organization (WHO)',
    title: 'WHO recommendations on maternal and newborn care for a positive postnatal experience (2022 guideline PDF)',
    url: 'https://apps.who.int/iris/bitstream/handle/10665/352658/9789240045989-eng.pdf',
    publishedOrUpdatedAt: '2022-03-30',
  },
  'who-breastfeeding': {
    id: 'who-breastfeeding',
    organization: 'World Health Organization (WHO)',
    title: 'Protecting, promoting and supporting breastfeeding in facilities providing maternity and newborn services (WHO guideline)',
    url: 'https://www.who.int/publications/i/item/9789241550086',
    publishedOrUpdatedAt: '2017-11-02',
  },
  'nhs-safer-sleep': {
    id: 'nhs-safer-sleep',
    organization: 'NHS (UK)',
    title: 'Sudden infant death syndrome (SIDS)',
    url: 'https://www.nhs.uk/conditions/sudden-infant-death-syndrome-sids/',
    publishedOrUpdatedAt: '2025-11-13',
  },
  'nhs-sleep-patterns': {
    id: 'nhs-sleep-patterns',
    organization: 'NHS (UK)',
    title: 'Helping your baby to sleep',
    url: 'https://www.nhs.uk/baby/caring-for-a-newborn/helping-your-baby-to-sleep/',
    publishedOrUpdatedAt: '2025-11-13',
  },
  'nice-postnatal-care': {
    id: 'nice-postnatal-care',
    organization: 'NICE (UK)',
    title: 'Postnatal care recommendations (including safer sleep and bed sharing)',
    url: 'https://www.nice.org.uk/guidance/ng194/chapter/Recommendations',
    publishedOrUpdatedAt: '2021-04',
  },
  'canada-joint-safe-sleep': {
    id: 'canada-joint-safe-sleep',
    organization: 'Public Health Agency of Canada',
    title: 'Joint Statement on Safe Sleep: Reducing Sudden Infant Deaths in Canada',
    url: 'https://www.canada.ca/en/public-health/services/publications/healthy-living/joint-statement-on-safe-sleep.html',
    publishedOrUpdatedAt: '2025-02-28',
  },
  'aap-safe-sleep-2022': {
    id: 'aap-safe-sleep-2022',
    organization: 'American Academy of Pediatrics (AAP)',
    title: 'Sleep-Related Infant Deaths: Updated 2022 Recommendations for Reducing Infant Deaths in the Sleep Environment',
    url: 'https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/Sleep-Related-Infant-Deaths-Updated-2022',
    publishedOrUpdatedAt: '2022-07-01',
  },
  'cdc-safe-sleep': {
    id: 'cdc-safe-sleep',
    organization: 'Centers for Disease Control and Prevention (CDC)',
    title: 'Providing Care for Babies to Sleep Safely',
    url: 'https://www.cdc.gov/sudden-infant-death/sleep-safely/index.html',
    publishedOrUpdatedAt: '2024-09-17',
  },
  'canada-safe-sleep-tips': {
    id: 'canada-safe-sleep-tips',
    organization: 'Health Canada',
    title: 'Safe sleep for every sleep',
    url: 'https://www.canada.ca/en/health-canada/services/safe-sleep/safe-sleep-tips.html',
    publishedOrUpdatedAt: '2024-10-09',
  },
  'mindell-behavioral-2006': {
    id: 'mindell-behavioral-2006',
    organization: 'Sleep (peer-reviewed)',
    title: 'Behavioral treatment of bedtime problems and night wakings in infants and young children',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17068979/',
    publishedOrUpdatedAt: '2006',
  },
  'gradisar-rct-2016': {
    id: 'gradisar-rct-2016',
    organization: 'Pediatrics (peer-reviewed)',
    title: 'Behavioral interventions for infant sleep problems: randomized controlled trial',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27221288/',
    publishedOrUpdatedAt: '2016',
  },
  'price-followup-2012': {
    id: 'price-followup-2012',
    organization: 'Pediatrics (peer-reviewed)',
    title: 'Five-year follow-up of harms and benefits of behavioral infant sleep intervention',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22966034/',
    publishedOrUpdatedAt: '2012',
  },
  'mindell-bedtime-routine-2009': {
    id: 'mindell-bedtime-routine-2009',
    organization: 'Sleep (peer-reviewed)',
    title: 'A nightly bedtime routine: impact on sleep in young children and maternal mood',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19480226/',
    publishedOrUpdatedAt: '2009',
  },
  'mindell-bedtime-routine-2015': {
    id: 'mindell-bedtime-routine-2015',
    organization: 'Sleep (peer-reviewed)',
    title: 'Bedtime routines for young children: dose-dependent association with sleep outcomes',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25325483/',
    publishedOrUpdatedAt: '2015',
  },
  'cross-cultural-sleep-2010': {
    id: 'cross-cultural-sleep-2010',
    organization: 'Sleep Medicine (peer-reviewed)',
    title: 'Cross-cultural differences in infant and toddler sleep',
    url: 'https://pubmed.ncbi.nlm.nih.gov/20138578/',
    publishedOrUpdatedAt: '2010',
  },
}

const KNOWLEDGE_FILE_SOURCE_MAP: Record<string, string[]> = {
  'core-principles.txt': ['aap-safe-sleep-2022', 'nhs-safer-sleep', 'nice-postnatal-care', 'canada-joint-safe-sleep'],
  'red-flags.txt': ['aap-safe-sleep-2022', 'cdc-safe-sleep', 'nice-postnatal-care', 'canada-safe-sleep-tips'],
  'sleep-environment.txt': ['aap-safe-sleep-2022', 'cdc-safe-sleep', 'nhs-safer-sleep', 'canada-safe-sleep-tips'],
  'bedtime-routines.txt': ['mindell-bedtime-routine-2009', 'mindell-bedtime-routine-2015', 'nhs-sleep-patterns'],
  'regressions.txt': ['nhs-sleep-patterns', 'mindell-behavioral-2006'],
  'parent-factors.txt': ['who-postnatal-care', 'price-followup-2012'],
  'night-weaning.txt': ['who-breastfeeding', 'nhs-sleep-patterns'],
  'nap-transitions.txt': ['nhs-sleep-patterns', 'mindell-behavioral-2006'],
  'cultural-considerations.txt': ['who-postnatal-care', 'nice-postnatal-care', 'aap-safe-sleep-2022', 'cross-cultural-sleep-2010'],
  'methods-gentle.txt': ['mindell-behavioral-2006', 'gradisar-rct-2016', 'price-followup-2012'],
  'methods-gradual.txt': ['mindell-behavioral-2006', 'gradisar-rct-2016', 'price-followup-2012'],
  'methods-direct.txt': ['mindell-behavioral-2006', 'gradisar-rct-2016', 'price-followup-2012'],
  'problems-bedtime-resistance.txt': ['mindell-behavioral-2006', 'mindell-bedtime-routine-2015', 'nhs-sleep-patterns'],
  'problems-night-wakings.txt': ['mindell-behavioral-2006', 'gradisar-rct-2016', 'price-followup-2012'],
  'problems-falling-asleep.txt': ['mindell-behavioral-2006', 'gradisar-rct-2016'],
  'problems-short-naps.txt': ['mindell-behavioral-2006', 'nhs-sleep-patterns'],
  'problems-early-waking.txt': ['nhs-sleep-patterns', 'mindell-behavioral-2006'],
  'age-0-3-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
  'age-4-6-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
  'age-6-9-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
  'age-9-12-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
  'age-12-18-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
  'age-18-24-months.txt': ['aap-safe-sleep-2022', 'nhs-sleep-patterns'],
}

function getEvidenceOrder(sourceId: string) {
  const index = EVIDENCE_SOURCE_ORDER.indexOf(sourceId as typeof EVIDENCE_SOURCE_ORDER[number])
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export function getAllEvidenceSources(): EvidenceSource[] {
  return Object.values(EVIDENCE_SOURCES).sort((a, b) => getEvidenceOrder(a.id) - getEvidenceOrder(b.id))
}

export function collectEvidenceSourcesForKnowledgeFiles(knowledgeFiles: string[]): EvidenceSource[] {
  const sourceIds = new Set<string>(BASE_EVIDENCE_SOURCE_IDS)

  for (const file of knowledgeFiles) {
    const mappedIds = KNOWLEDGE_FILE_SOURCE_MAP[file]
    if (!mappedIds) continue
    for (const id of mappedIds) {
      sourceIds.add(id)
    }
  }

  return [...sourceIds]
    .filter((id) => id in EVIDENCE_SOURCES)
    .sort((a, b) => getEvidenceOrder(a) - getEvidenceOrder(b))
    .slice(0, MAX_EVIDENCE_SOURCES)
    .map((id) => EVIDENCE_SOURCES[id])
}

export function appendEvidenceSection(planContent: string, sources: EvidenceSource[]): string {
  if (sources.length === 0) return planContent
  if (/##\s+Evidence and Safety Sources/i.test(planContent)) return planContent

  const trimmed = planContent.trimEnd()
  const lines = sources.map((source, index) =>
    `${index + 1}. **${source.organization}** - [${source.title}](${source.url})`
  )

  return `${trimmed}

---

## Evidence and Safety Sources

This plan is personalized from your questionnaire and informed by established clinical guidance and peer-reviewed research. It does not replace medical advice from your clinician.

${lines.join('\n')}
`
}
