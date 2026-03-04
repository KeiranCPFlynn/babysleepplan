import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Load .env.local manually (no dotenv dependency needed)
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = value
}

const API_KEY = process.env.KEYWORDS_EVERYWHERE_KEY
if (!API_KEY) {
  console.error('Missing KEYWORDS_EVERYWHERE_KEY in .env.local')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Keyword Lists by Category (~400 keywords)
// ---------------------------------------------------------------------------

const CATEGORIES: Record<string, string[]> = {
  'Sleep Training Methods': [
    'baby sleep training', 'gentle sleep training', 'cry it out method', 'ferber method',
    'pick up put down method', 'no cry sleep solution', 'sleep training 4 months',
    'sleep training 6 months', 'sleep training 8 months', 'sleep training 1 year old',
    'gradual withdrawal sleep training', 'chair method sleep training',
    'when to start sleep training', 'is sleep training safe', 'sleep training gentle methods',
    'controlled crying', 'self settling baby', 'teach baby to self soothe',
    'baby self settling techniques', 'sleep training toddler', 'sleep training naps',
    'sleep training night feeds', 'sleep training regression', 'camping out method baby',
    'fade out method sleep', 'shush pat method', 'responsive settling baby',
    'baby sleep consultant', 'online sleep consultant baby', 'sleep training plan',
  ],

  'Sleep Regressions': [
    '4 month sleep regression', '6 month sleep regression', '8 month sleep regression',
    '9 month sleep regression', '12 month sleep regression', '18 month sleep regression',
    '2 year sleep regression', '3 year sleep regression', 'sleep regression how long',
    'sleep regression signs', 'sleep regression or teething', 'baby sleep regression ages',
    'toddler sleep regression', 'newborn sleep regression', 'sleep regression naps',
    'what causes sleep regression', 'how to survive sleep regression',
    'sleep regression tips', 'developmental leap sleep', 'wonder weeks sleep regression',
    'growth spurt sleep regression', 'separation anxiety sleep regression',
    'standing in cot sleep regression', 'sleep regression night feeds',
    'how to handle sleep regression',
  ],

  'Nap Issues': [
    'baby short naps', 'baby nap schedule', 'baby won\'t nap', 'how to extend baby naps',
    'nap transition 3 to 2', 'nap transition 2 to 1', 'when to drop to 1 nap',
    'when to drop to 2 naps', 'contact naps only', 'cot naps', 'nap in crib',
    'baby only naps 30 minutes', 'baby fighting naps', 'overtired baby won\'t nap',
    'under tired baby won\'t nap', 'catnapping baby', 'nap schedule by age',
    'how many naps by age', 'wake windows', 'wake windows by age',
    'baby awake time between naps', 'nap training', 'crib hour nap training',
    'nap trapped', 'baby won\'t nap in cot', 'newborn nap schedule',
    'toddler nap refusal', 'toddler won\'t nap', '2 year old dropping nap',
    'when do toddlers stop napping',
  ],

  'Night Waking': [
    'baby waking every hour', 'baby waking every 2 hours', 'baby waking at night',
    'night waking baby', 'baby waking at 3am', 'baby waking at 4am', 'baby waking at 5am',
    'early morning waking baby', 'baby won\'t go back to sleep', 'false starts baby sleep',
    'split nights baby', 'baby awake for hours at night', 'baby waking for feeds at night',
    'how to stop night feeds', 'night weaning', 'baby hungry at night',
    'dream feed', 'dream feed how to', 'when to stop dream feed',
    'baby waking out of habit', 'night waking toddler', 'toddler waking at night',
    'toddler night terrors', 'baby nightmares', 'night terrors vs nightmares',
    'baby screaming at night', 'baby inconsolable at night', 'baby waking crying',
    'cosleeping to cot transition', 'stop cosleeping',
  ],

  'Bedtime Issues': [
    'bedtime routine baby', 'bedtime routine toddler', 'baby won\'t go to sleep',
    'toddler bedtime battles', 'best bedtime for baby', 'ideal bedtime by age',
    'bedtime stalling toddler', 'baby overtired at bedtime', 'baby screaming at bedtime',
    'bedtime for 6 month old', 'bedtime for 1 year old', 'bedtime for 2 year old',
    'how to get baby to sleep', 'how to settle baby at night', 'baby fighting sleep',
    'establishing bedtime routine', 'bedtime routine newborn', 'bath before bed baby',
    'calm baby before bed', 'sleep associations', 'negative sleep associations',
    'feeding to sleep', 'rocking baby to sleep', 'dummy to sleep',
    'pacifier sleep association',
  ],

  'Age-Specific Schedules': [
    'newborn sleep schedule', '3 month old sleep schedule', '4 month old sleep schedule',
    '5 month old sleep schedule', '6 month old sleep schedule', '7 month old sleep schedule',
    '8 month old sleep schedule', '9 month old sleep schedule', '10 month old sleep schedule',
    '11 month old sleep schedule', '12 month old sleep schedule', '1 year old sleep schedule',
    '18 month old sleep schedule', '2 year old sleep schedule', '3 year old sleep schedule',
    'how much sleep does a baby need', 'how much sleep newborn',
    'how much sleep 6 month old', 'baby sleep by age', 'toddler sleep needs',
    'baby sleep chart by age', 'recommended sleep by age', 'baby sleep hours',
    'newborn sleep patterns', 'newborn only sleeps on me', 'newborn day night confusion',
    'day night confusion newborn', 'overtired baby', 'overtired baby signs',
    'overtired toddler', 'over stimulated baby', 'undertired baby signs',
    'total sleep by age', 'awake time by age', 'baby sleep windows',
  ],

  'Sleep Environment & Safety': [
    'safe sleep baby', 'baby sleep temperature', 'baby room temperature for sleeping',
    'white noise baby sleep', 'best white noise for baby', 'dark room baby sleep',
    'blackout blinds baby', 'baby sleep sack', 'sleeping bag baby', 'TOG rating baby',
    'what to dress baby in at night', 'baby sleep position', 'swaddling baby',
    'when to stop swaddling', 'swaddle transition', 'safe cot setup',
    'crib mattress safety', 'back to sleep', 'SIDS prevention', 'room sharing baby',
    'when to move baby to own room', 'baby monitor', 'baby sleep light',
    'red light baby sleep', 'nursery temperature',
  ],

  'Product Comparisons & Apps': [
    'huckleberry app', 'huckleberry alternative', 'huckleberry sleep app',
    'best baby sleep app', 'best baby sleep app 2025', 'best baby sleep app 2026',
    'baby sleep tracker app', 'baby sleep app free', 'baby schedule app',
    'taking cara babies', 'taking cara babies review', 'moms on call', 'precious little sleep',
    'baby sleep consultant app', 'AI baby sleep', 'AI sleep plan baby',
    'personalised baby sleep plan', 'custom baby sleep plan', 'baby sleep plan online',
    'snoo alternative',
  ],

  'UK-Specific Terms': [
    'baby won\'t sleep in cot', 'baby sleeping bag uk', 'baby sleep consultant uk',
    'cot to bed transition', 'dummy weaning', 'how to wean off dummy',
    'dummy fairy', 'health visitor baby sleep', 'NHS baby sleep advice',
    'baby sleep guide uk', 'toddler sleep uk', 'sleep training uk',
    'controlled crying uk guidelines', 'baby sleeping bag TOG guide',
    'grobag', 'baby room temperature celsius', 'comforter for baby sleep',
    'muslin comforter sleep', 'what is a sleep regression uk',
    'gentle sleep training uk',
  ],

  'Specific Situations': [
    'teething and sleep', 'teething baby won\'t sleep', 'illness and baby sleep',
    'baby sleep after vaccinations', 'reflux baby sleep', 'colic and sleep',
    'baby sleep while travelling', 'jet lag baby', 'clock change baby sleep',
    'daylight saving baby', 'baby sleep during growth spurt', 'baby sleep milestones',
    'crawling affecting sleep', 'walking affecting sleep', 'baby sleep regression crawling',
    'baby sleep positions rolling', 'baby rolling in sleep', 'baby rolling onto tummy sleep',
    'sibling sharing room sleep', 'baby waking toddler', 'twins sleep schedule',
    'breastfed baby sleep', 'formula fed baby sleep', 'how to sleep train breastfed baby',
    'baby sleep without feeding', 'weaning and sleep', 'starting solids and sleep',
    'baby hunger cues night', 'sleep deprivation parents', 'tired parent help',
  ],

  'Long-Tail Questions': [
    'why does my baby wake up as soon as I put them down',
    'how to break nurse to sleep association',
    'is it normal for baby to wake every hour',
    'when will my baby sleep through the night',
    'what age do babies sleep through',
    'how to get overtired baby to sleep',
    'why is my baby fighting sleep',
    'baby sleeps all day awake all night',
    'can you sleep train a breastfed baby',
    'should I wake baby from nap',
    'how long should a baby nap',
    'baby won\'t nap unless held',
    'how to get baby to nap in cot',
    'my baby only sleeps when held',
    'how to put baby down awake',
    'drowsy but awake not working',
    'baby cries when put down to sleep',
    'toddler won\'t stay in bed',
    'toddler getting out of bed',
    'how to transition from cosleeping to cot',
    'baby sleep schedule sample',
    'free baby sleep schedule',
    'how to create baby sleep schedule',
    'best baby sleep routine',
    'what is a good bedtime routine for baby',
    'signs baby is ready for sleep training',
    'how to night wean gently',
    'baby waking too early what to do',
    'baby nap schedule 6 months',
    'how to fix early morning waking',
  ],
}

// ---------------------------------------------------------------------------
// Existing Pages (for gap analysis)
// ---------------------------------------------------------------------------

const EXISTING_CONTENT = [
  { path: '/', keywords: ['baby sleep plan', 'AI sleep consultant', 'personalized baby sleep', 'infant sleep schedule', 'baby sleep help', 'toddler sleep plan'] },
  { path: '/4-month-sleep-regression', keywords: ['4 month sleep regression'] },
  { path: '/toddler-sleep-2-year-old', keywords: ['toddler sleep', '2 year old sleep'] },
  { path: '/huckleberry-alternative', keywords: ['huckleberry alternative'] },
  { path: '/free-schedule', keywords: ['free baby sleep schedule', 'schedule builder'] },
  { path: '/how-it-works', keywords: ['AI baby sleep planner', 'personalized baby sleep plan'] },
  { path: '/science', keywords: ['baby sleep science', 'sleep training research'] },
  { path: '/compare', keywords: ['sleep consultant vs AI', 'baby sleep consultant alternative'] },
  // Blog posts
  { path: '/blog/baby-short-naps-30-minutes-why-and-how-to-fix-them', keywords: ['baby short naps', '30 minute naps'] },
  { path: '/blog/baby-sleep-regression-what-to-expect-and-what-helps', keywords: ['sleep regression', 'baby sleep regression'] },
  { path: '/blog/baby-sleep-sack-or-baby-sleeping-bag-a-safe-guide', keywords: ['baby sleep sack', 'sleeping bag baby'] },
  { path: '/blog/baby-sleep-training-a-gentle-evidence-based-guide-for-tired-parents', keywords: ['baby sleep training', 'gentle sleep training'] },
  { path: '/blog/baby-waking-at-5am-early-morning-fixes-that-work', keywords: ['baby waking at 5am', 'early morning waking'] },
  { path: '/blog/baby-waking-every-hour-causes-and-gentle-fixes', keywords: ['baby waking every hour', 'night waking'] },
  { path: '/blog/baby-wont-sleep-in-cot-gentle-evidence-based-solutions', keywords: ['baby won\'t sleep in cot'] },
  { path: '/blog/how-to-help-teething-baby-sleep-gentle-night-guide', keywords: ['teething and sleep', 'teething baby'] },
  { path: '/blog/perfect-bedtime-routine-by-age', keywords: ['bedtime routine', 'bedtime routine baby'] },
  { path: '/blog/understanding-baby-sleep-cycles', keywords: ['baby sleep cycles', 'sleep science'] },
  { path: '/blog/wake-windows-by-age-the-complete-guide', keywords: ['wake windows', 'wake windows by age'] },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeywordResult {
  keyword: string
  category: string
  vol_gb: number
  cpc_gb: number
  competition_gb: number
  trend_gb: number[]
  vol_us: number
  cpc_us: number
  competition_us: number
  trend_us: number[]
  combined_vol: number
}

interface APIKeywordData {
  keyword: string
  vol: number
  cpc: { value: string; currency: string }
  competition: number
  trend: { month: string; year: number; value: number }[]
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function fetchBatch(keywords: string[], country: string, currency: string): Promise<APIKeywordData[]> {
  const params = new URLSearchParams()
  params.append('country', country)
  params.append('currency', currency)
  params.append('dataSource', 'gkp')
  for (const kw of keywords) {
    params.append('kw[]', kw)
  }

  const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: params,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text}`)
  }

  const json = await response.json()
  return json.data || []
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function findExistingCoverage(keyword: string): string | null {
  const lower = keyword.toLowerCase()
  for (const page of EXISTING_CONTENT) {
    for (const pk of page.keywords) {
      if (lower.includes(pk.toLowerCase()) || pk.toLowerCase().includes(lower)) {
        return page.path
      }
    }
    // Also check if slug contains keyword words
    const slugWords = page.path.replace(/\//g, ' ').replace(/-/g, ' ').toLowerCase()
    if (lower.split(' ').length <= 4 && slugWords.includes(lower)) {
      return page.path
    }
  }
  return null
}

function generateMarkdownSummary(results: KeywordResult[]): string {
  const sorted = [...results].sort((a, b) => b.combined_vol - a.combined_vol)
  const lines: string[] = []

  lines.push('# LunaCradle Keyword Research Report')
  lines.push(``)
  lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
  lines.push(`**Total keywords:** ${results.length}`)
  lines.push(`**Markets:** UK (gb) + US (us)`)
  lines.push('')

  // ---- Top 50 by combined volume ----
  lines.push('## Top 50 Keywords by Search Volume (UK + US)')
  lines.push('')
  lines.push('| # | Keyword | UK Vol | US Vol | Combined | UK CPC | US CPC | Competition | Covered? |')
  lines.push('|---|---------|--------|--------|----------|--------|--------|-------------|----------|')
  for (let i = 0; i < Math.min(50, sorted.length); i++) {
    const kw = sorted[i]
    const covered = findExistingCoverage(kw.keyword)
    lines.push(`| ${i + 1} | ${kw.keyword} | ${kw.vol_gb.toLocaleString()} | ${kw.vol_us.toLocaleString()} | ${kw.combined_vol.toLocaleString()} | ${kw.cpc_gb.toFixed(2)} | ${kw.cpc_us.toFixed(2)} | ${kw.competition_gb.toFixed(2)} | ${covered || 'NO'} |`)
  }
  lines.push('')

  // ---- Top 30 by CPC (commercial intent) ----
  const byCPC = [...results].sort((a, b) => Math.max(b.cpc_gb, b.cpc_us) - Math.max(a.cpc_gb, a.cpc_us))
  lines.push('## Top 30 Keywords by CPC (Commercial Intent)')
  lines.push('')
  lines.push('| # | Keyword | Max CPC | UK Vol | US Vol | Competition | Covered? |')
  lines.push('|---|---------|---------|--------|--------|-------------|----------|')
  for (let i = 0; i < Math.min(30, byCPC.length); i++) {
    const kw = byCPC[i]
    const covered = findExistingCoverage(kw.keyword)
    lines.push(`| ${i + 1} | ${kw.keyword} | ${Math.max(kw.cpc_gb, kw.cpc_us).toFixed(2)} | ${kw.vol_gb.toLocaleString()} | ${kw.vol_us.toLocaleString()} | ${kw.competition_gb.toFixed(2)} | ${covered || 'NO'} |`)
  }
  lines.push('')

  // ---- Low competition + high volume opportunities ----
  const opportunities = sorted
    .filter(kw => kw.competition_gb < 0.4 && kw.combined_vol >= 500)
    .slice(0, 30)
  lines.push('## Low Competition Opportunities (competition < 0.4, volume >= 500)')
  lines.push('')
  if (opportunities.length === 0) {
    lines.push('No keywords found matching these criteria. Try adjusting thresholds.')
  } else {
    lines.push('| # | Keyword | Combined Vol | Competition | CPC (UK) | Covered? |')
    lines.push('|---|---------|-------------|-------------|----------|----------|')
    for (let i = 0; i < opportunities.length; i++) {
      const kw = opportunities[i]
      const covered = findExistingCoverage(kw.keyword)
      lines.push(`| ${i + 1} | ${kw.keyword} | ${kw.combined_vol.toLocaleString()} | ${kw.competition_gb.toFixed(2)} | ${kw.cpc_gb.toFixed(2)} | ${covered || 'NO'} |`)
    }
  }
  lines.push('')

  // ---- Gap Analysis ----
  const uncovered = sorted.filter(kw => !findExistingCoverage(kw.keyword) && kw.combined_vol >= 100)
  lines.push('## Content Gap Analysis (Not Covered, Volume >= 100)')
  lines.push('')
  lines.push(`**${uncovered.length} uncovered keywords** with meaningful search volume.`)
  lines.push('')
  lines.push('| # | Keyword | Category | Combined Vol | UK CPC | Competition |')
  lines.push('|---|---------|----------|-------------|--------|-------------|')
  for (let i = 0; i < Math.min(60, uncovered.length); i++) {
    const kw = uncovered[i]
    lines.push(`| ${i + 1} | ${kw.keyword} | ${kw.category} | ${kw.combined_vol.toLocaleString()} | ${kw.cpc_gb.toFixed(2)} | ${kw.competition_gb.toFixed(2)} |`)
  }
  lines.push('')

  // ---- Category Summary ----
  const categoryMap = new Map<string, KeywordResult[]>()
  for (const kw of results) {
    if (!categoryMap.has(kw.category)) categoryMap.set(kw.category, [])
    categoryMap.get(kw.category)!.push(kw)
  }

  lines.push('## Volume by Category')
  lines.push('')
  lines.push('| Category | Keywords | Total UK Vol | Total US Vol | Avg CPC (UK) | Top Keyword |')
  lines.push('|----------|----------|-------------|-------------|-------------|-------------|')
  for (const [cat, kws] of categoryMap) {
    const totalGB = kws.reduce((s, k) => s + k.vol_gb, 0)
    const totalUS = kws.reduce((s, k) => s + k.vol_us, 0)
    const avgCPC = kws.reduce((s, k) => s + k.cpc_gb, 0) / kws.length
    const top = [...kws].sort((a, b) => b.combined_vol - a.combined_vol)[0]
    lines.push(`| ${cat} | ${kws.length} | ${totalGB.toLocaleString()} | ${totalUS.toLocaleString()} | ${avgCPC.toFixed(2)} | ${top.keyword} (${top.combined_vol.toLocaleString()}) |`)
  }
  lines.push('')

  // ---- Blog Post Suggestions ----
  lines.push('## Suggested New Blog Posts (by gap analysis)')
  lines.push('')
  lines.push('Clusters of uncovered high-volume keywords that could each be a blog post:')
  lines.push('')

  // Group uncovered keywords by category and suggest posts
  const uncoveredByCategory = new Map<string, KeywordResult[]>()
  for (const kw of uncovered) {
    if (!uncoveredByCategory.has(kw.category)) uncoveredByCategory.set(kw.category, [])
    uncoveredByCategory.get(kw.category)!.push(kw)
  }

  let postNum = 1
  for (const [cat, kws] of uncoveredByCategory) {
    if (kws.length === 0) continue
    const topKws = kws.slice(0, 5)
    const totalVol = kws.reduce((s, k) => s + k.combined_vol, 0)
    lines.push(`### ${postNum}. ${cat}`)
    lines.push(`- **Total addressable volume:** ${totalVol.toLocaleString()}/month`)
    lines.push(`- **Top keywords:** ${topKws.map(k => `"${k.keyword}" (${k.combined_vol.toLocaleString()})`).join(', ')}`)
    lines.push(`- **All uncovered keywords in this category:** ${kws.map(k => k.keyword).join(', ')}`)
    lines.push('')
    postNum++
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Flatten all keywords with their category
  const allEntries: { keyword: string; category: string }[] = []
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const kw of keywords) {
      allEntries.push({ keyword: kw, category })
    }
  }

  console.log(`Total keywords: ${allEntries.length}`)
  console.log(`Batches needed: ${Math.ceil(allEntries.length / 100)} per country (x2 countries)`)
  console.log(`Estimated credits: ~${allEntries.length * 2}`)
  console.log('')

  // Batch into groups of 100
  const batches: typeof allEntries[] = []
  for (let i = 0; i < allEntries.length; i += 100) {
    batches.push(allEntries.slice(i, i + 100))
  }

  // Fetch UK data
  console.log('=== Fetching UK (gb) data ===')
  const gbDataMap = new Map<string, APIKeywordData>()
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} keywords)...`)
    try {
      const data = await fetchBatch(batch.map(b => b.keyword), 'gb', 'GBP')
      for (const d of data) {
        gbDataMap.set(d.keyword.toLowerCase(), d)
      }
      console.log(`    Got ${data.length} results`)
    } catch (err) {
      console.error(`    Error: ${err}`)
    }
    if (i < batches.length - 1) await sleep(1500)
  }

  // Fetch US data
  console.log('')
  console.log('=== Fetching US (us) data ===')
  const usDataMap = new Map<string, APIKeywordData>()
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} keywords)...`)
    try {
      const data = await fetchBatch(batch.map(b => b.keyword), 'us', 'USD')
      for (const d of data) {
        usDataMap.set(d.keyword.toLowerCase(), d)
      }
      console.log(`    Got ${data.length} results`)
    } catch (err) {
      console.error(`    Error: ${err}`)
    }
    if (i < batches.length - 1) await sleep(1500)
  }

  // Merge results
  console.log('')
  console.log('Merging results...')
  const results: KeywordResult[] = []
  for (const entry of allEntries) {
    const gb = gbDataMap.get(entry.keyword.toLowerCase())
    const us = usDataMap.get(entry.keyword.toLowerCase())

    const volGB = gb?.vol ?? 0
    const volUS = us?.vol ?? 0

    results.push({
      keyword: entry.keyword,
      category: entry.category,
      vol_gb: volGB,
      cpc_gb: gb?.cpc ? parseFloat(gb.cpc.value) : 0,
      competition_gb: gb?.competition ?? 0,
      trend_gb: gb?.trend?.map(t => t.value) ?? [],
      vol_us: volUS,
      cpc_us: us?.cpc ? parseFloat(us.cpc.value) : 0,
      competition_us: us?.competition ?? 0,
      trend_us: us?.trend?.map(t => t.value) ?? [],
      combined_vol: volGB + volUS,
    })
  }

  // Write outputs
  const outDir = join(process.cwd(), 'scripts', 'output')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const rawPath = join(outDir, 'keyword-data-raw.json')
  writeFileSync(rawPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    totalKeywords: results.length,
    creditsUsed: results.length * 2,
    results,
  }, null, 2))
  console.log(`Wrote ${rawPath}`)

  const summaryPath = join(outDir, 'keyword-data-summary.md')
  writeFileSync(summaryPath, generateMarkdownSummary(results))
  console.log(`Wrote ${summaryPath}`)

  // Quick console summary
  const topByVol = [...results].sort((a, b) => b.combined_vol - a.combined_vol).slice(0, 10)
  console.log('')
  console.log('=== Top 10 Keywords by Combined Volume ===')
  for (const kw of topByVol) {
    const covered = findExistingCoverage(kw.keyword) ? 'COVERED' : 'GAP'
    console.log(`  ${kw.combined_vol.toLocaleString().padStart(8)} | ${kw.keyword} [${covered}]`)
  }

  console.log('')
  console.log('Done! Review scripts/output/keyword-data-summary.md for full analysis.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
