'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode } from 'react'

interface PlanContentProps {
  content: string
}

const LEGACY_EVIDENCE_LINK_REPLACEMENTS: Record<string, string> = {
  'https://www.who.int/tools/your-life-your-health/life-phase/newborns-and-children-under-5-years/making-sure-newborns-and-children-under-5-years-sleep-safely':
    'https://apps.who.int/iris/bitstream/handle/10665/352658/9789240045989-eng.pdf',
}

// Detect blockquote type based on content
function getTextFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextFromNode).join('')
  if (typeof node === 'object' && 'props' in node) {
    return getTextFromNode((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

function getBlockquoteStyle(children: ReactNode): { className: string; label: string | null } {
  const text = getTextFromNode(children).toLowerCase()

  if (text.includes('tip:') || text.includes('tip')) {
    return {
      className: 'bg-amber-50 border-2 border-dashed border-amber-200 py-4 px-5 rounded-xl my-6 not-italic dark:bg-amber-950/35 dark:border-amber-700/60',
      label: 'Helpful Tip'
    }
  }
  if (text.includes('good to know') || text.includes('warning')) {
    return {
      className: 'bg-orange-50 border-l-4 border-orange-300 py-4 px-5 rounded-r-xl my-6 not-italic dark:bg-orange-950/35 dark:border-orange-700/65',
      label: null
    }
  }
  if (text.includes('remember') || text.includes("you've got this") || text.includes('you can do')) {
    return {
      className: 'bg-pink-50 border-2 border-pink-200 py-4 px-5 rounded-xl my-6 not-italic dark:bg-pink-950/30 dark:border-pink-700/60',
      label: null
    }
  }
  if (text.includes('short version') || text.includes('milestone')) {
    return {
      className: 'bg-sky-50 border-l-4 border-sky-300 py-4 px-5 rounded-r-xl my-6 not-italic dark:bg-sky-950/30 dark:border-sky-700/60',
      label: null
    }
  }

  return {
    className: 'bg-sky-50 border-l-4 border-sky-300 py-4 px-5 rounded-r-xl my-6 not-italic dark:bg-sky-950/30 dark:border-sky-700/60',
    label: null
  }
}

export function PlanContent({ content }: PlanContentProps) {
  const normalizeLegacyEvidenceLinks = (input: string) => {
    let normalized = input

    for (const [legacyUrl, replacementUrl] of Object.entries(LEGACY_EVIDENCE_LINK_REPLACEMENTS)) {
      normalized = normalized.split(legacyUrl).join(replacementUrl)
    }

    return normalized
  }

  const normalizeNumberedLists = (input: string) => {
    const lines = input.replace(/^(\s*)(\d+)\)\s+/gm, '$1$2. ').split('\n')
    const normalized: string[] = []

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      const prevLine = normalized[normalized.length - 1] ?? ''
      const isNumberedLine = /^\s*\d+\.\s+/.test(line)
      const prevIsListLine = /^\s*\d+\.\s+/.test(prevLine) || /^\s*[-*+]\s+/.test(prevLine)

      if (isNumberedLine && prevLine.trim() !== '' && !prevIsListLine) {
        normalized.push('')
      }

      normalized.push(line)
    }

    return normalized.join('\n')
  }

  const normalizedContent = normalizeNumberedLists(normalizeLegacyEvidenceLinks(content))

  return (
    <div id="plan-content" className="plan-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-200 text-center mb-8 pb-4 border-b-2 border-purple-100 dark:border-purple-700/50">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <div className="bg-sky-100/75 border-l-[5px] border-sky-300 rounded-xl py-4 px-6 mt-10 mb-6 shadow-sm dark:bg-sky-900/35 dark:border-sky-600/70">
              <h2 className="text-xl font-bold text-purple-700 dark:text-purple-200 m-0">
                {children}
              </h2>
            </div>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-purple-600 dark:text-purple-200 mt-8 mb-4 pb-2 border-b border-purple-100 dark:border-purple-700/50">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold text-gray-700 dark:text-slate-200 mt-5 mb-3">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => {
            const { className, label } = getBlockquoteStyle(children)
            return (
              <blockquote className={className}>
                {label && (
                  <span className="block text-sm font-bold text-pink-500 dark:text-pink-300 uppercase tracking-wide mb-2">
                    {label}
                  </span>
                )}
                <div className="text-slate-600 dark:text-slate-200 text-base leading-relaxed [&>p]:m-0">
                  {children}
                </div>
              </blockquote>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-50 dark:bg-purple-900/35">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-5 py-4 text-left text-sm font-bold text-purple-700 dark:text-purple-200 uppercase tracking-wide">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-amber-50/50 dark:even:bg-amber-900/20">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="px-5 py-4 text-base text-gray-600 dark:text-slate-200">
              {children}
            </td>
          ),
          ul: ({ children }) => (
            <ul className="space-y-3 my-5 pl-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-4 my-5 pl-0 list-none counter-reset-[step]">
              {children}
            </ol>
          ),
          hr: () => (
            <div className="flex items-center justify-center gap-3 my-10">
              <div className="flex-1 h-0.5 bg-purple-100 dark:bg-purple-700/40"></div>
              <div className="w-2 h-2 rounded-full bg-pink-300 dark:bg-pink-400/70"></div>
              <div className="flex-1 h-0.5 bg-purple-100 dark:bg-purple-700/40"></div>
            </div>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800 dark:text-slate-100">{children}</strong>
          ),
          p: ({ children }) => {
            const text = getTextFromNode(children).trim()
            const lowerText = text.toLowerCase()
            // Special formatting for troubleshooting patterns
            if (text.startsWith('If ') || text.match(/^If [^:]+:/)) {
              return (
                <p className="text-gray-600 dark:text-slate-200 text-base leading-relaxed my-4 pl-5 border-l-2 border-orange-200 bg-orange-50/50 py-3 pr-4 rounded-r dark:border-orange-700/60 dark:bg-orange-900/25">
                  {children}
                </p>
              )
            }
            if (lowerText.startsWith('why this change') || lowerText.startsWith('**why this change') || lowerText.includes('why this change')) {
              return (
                <div className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-700/60 dark:bg-emerald-900/25">
                  <p className="text-emerald-900 dark:text-emerald-200 text-base leading-relaxed m-0">
                    {children}
                  </p>
                </div>
              )
            }
            return <p className="text-slate-600 dark:text-slate-200 text-base leading-relaxed my-4">{children}</p>
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-purple-600 hover:text-purple-800 underline dark:text-purple-300 dark:hover:text-purple-200"
            >
              {children}
            </a>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
