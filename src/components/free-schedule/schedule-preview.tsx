'use client'

import { isValidElement, type ComponentProps, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ExtractedFields } from '@/lib/free-schedule/types'

interface SchedulePreviewProps {
  markdown: string
  extractedFields: ExtractedFields
  isUnlocked: boolean
}

// Split markdown into named sections on "## " headings
function splitSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  let key = '_pre'
  let buf: string[] = []
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      sections.set(key, buf.join('\n').trim())
      key = line
        .replace(/^## /, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
      buf = [line]
    } else {
      buf.push(line)
    }
  }
  sections.set(key, buf.join('\n').trim())
  return sections
}

function BlurGate({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden mt-4">
      <div className="pointer-events-none select-none" style={{ filter: 'blur(5px)' }}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 dark:bg-slate-900/75 rounded-lg px-4 text-center">
        <span className="text-2xl mb-2">🔒</span>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
      </div>
    </div>
  )
}

// Extract text from React nodes (used to detect "If..." paragraph styling)
function getNodeText(node: ReactNode): string {
  if (!node) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }
  return ''
}

// Shared ReactMarkdown component overrides — styled to match the PDF aesthetic
const mdComponents: ComponentProps<typeof ReactMarkdown>['components'] = {
  h2: ({ children }) => (
    <div className="bg-indigo-50 border-l-[5px] border-indigo-300 rounded-xl py-4 px-6 mt-8 mb-5 shadow-sm dark:bg-indigo-950/40 dark:border-indigo-500/60">
      <h2 className="text-base font-bold text-indigo-800 dark:text-indigo-200 m-0">{children}</h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mt-5 mb-2 pb-1 border-b border-indigo-100 dark:border-indigo-800">{children}</h3>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-sm">
      <table className="min-w-full">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-indigo-50 dark:bg-indigo-900/40">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
      {children}
    </th>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900/40">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="odd:bg-white even:bg-indigo-50/40 dark:odd:bg-transparent dark:even:bg-indigo-950/20">{children}</tr>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{children}</td>
  ),
  ul: ({ children }) => <ul className="space-y-2.5 my-4 pl-0 list-none">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <span className="text-pink-400 dark:text-pink-300 mt-0.5 flex-shrink-0 text-base leading-none">♡</span>
      <span>{children}</span>
    </li>
  ),
  p: ({ children }) => {
    // Style "If..." paragraphs (If/Then Adjustments) with an amber left border — matches PDF
    const text = getNodeText(children).trim()
    if (text.startsWith('If ')) {
      return (
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-3 pl-4 border-l-2 border-amber-300 bg-amber-50/60 py-2.5 pr-3 rounded-r dark:border-amber-600/50 dark:bg-amber-950/20">
          {children}
        </p>
      )
    }
    return <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-3">{children}</p>
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
  ),
}

export function SchedulePreview({ markdown, extractedFields, isUnlocked }: SchedulePreviewProps) {
  const { assumptions, confidence_score } = extractedFields

  const confidenceLabel =
    confidence_score >= 0.8 ? 'high' : confidence_score >= 0.5 ? 'medium' : 'low'

  const sections = splitSections(markdown)

  // Extract bullet lines from Key Guidance section
  const keyGuidanceRaw = sections.get('key_guidance') ?? ''
  const keyGuidanceLines = keyGuidanceRaw.split('\n')
  const headingLine = keyGuidanceLines[0] ?? '' // "## Key Guidance"
  // Accept both "- " and "* " list formats (Gemini may use either)
  const bulletLines = keyGuidanceLines.filter((l) => /^\s*[-*]\s/.test(l))
  const visibleBullets = bulletLines.slice(0, 2)
  const hiddenBullets = bulletLines.slice(2)

  const visibleGuidance = [headingLine, ...visibleBullets].join('\n').trim()
  const hiddenGuidance = hiddenBullets.length > 0 ? hiddenBullets.join('\n').trim() : null

  const ifThenContent = sections.get('if_then_adjustments') ?? ''
  const assumptionsContent = sections.get('assumptions') ?? ''
  const nextStepsContent = sections.get('next_steps') ?? ''

  // Collect any remaining sections (evidence, references, etc.)
  const knownKeys = new Set([
    '_pre',
    'your_daily_schedule',
    'key_guidance',
    'if_then_adjustments',
    'assumptions',
    'next_steps',
  ])
  const extraSections: string[] = []
  for (const [key, val] of sections.entries()) {
    if (!knownKeys.has(key) && val.trim()) {
      extraSections.push(val)
    }
  }

  const Md = ({ children }: { children: string }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {children}
    </ReactMarkdown>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Confidence + assumptions notice */}
      {(assumptions.length > 0 || confidence_score < 0.8) && (
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-100 dark:border-slate-700">
          <span className="font-medium">Confidence: {confidenceLabel}</span>
          {assumptions.length > 0 && (
            <span> · Assumptions: {assumptions.join('; ')}</span>
          )}
        </div>
      )}

      {/* Your Daily Schedule — always fully visible */}
      <Md>{sections.get('your_daily_schedule') ?? ''}</Md>

      {/* Key Guidance — unlocked: render full section; locked: show 2 bullets, blur rest */}
      {keyGuidanceRaw && isUnlocked && <Md>{keyGuidanceRaw}</Md>}

      {keyGuidanceRaw && !isUnlocked && (
        <>
          {visibleGuidance && <Md>{visibleGuidance}</Md>}
          {hiddenGuidance && (
            <BlurGate label="Enter your email below to see all guidance tips">
              <Md>{hiddenGuidance}</Md>
            </BlurGate>
          )}
        </>
      )}

      {/* If/Then Adjustments — blurred until unlocked */}
      {ifThenContent && !isUnlocked && (
        <BlurGate label="Enter your email to see how to adapt when things go off-plan">
          <Md>{ifThenContent}</Md>
        </BlurGate>
      )}

      {ifThenContent && isUnlocked && <Md>{ifThenContent}</Md>}

      {/* Assumptions + Next Steps + extras — shown after unlock */}
      {isUnlocked && assumptionsContent && <Md>{assumptionsContent}</Md>}
      {isUnlocked && nextStepsContent && <Md>{nextStepsContent}</Md>}
      {isUnlocked && extraSections.map((sec, i) => <Md key={i}>{sec}</Md>)}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        For informational purposes only. Not medical advice. Always follow your paediatrician's guidance.
      </p>
    </div>
  )
}
