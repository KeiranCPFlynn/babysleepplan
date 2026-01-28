'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode } from 'react'

interface PlanContentProps {
  content: string
}

// Detect blockquote type based on content
function getBlockquoteStyle(children: ReactNode): { className: string; label: string | null } {
  const text = String(children).toLowerCase()

  if (text.includes('tip:') || text.includes('tip')) {
    return {
      className: 'bg-amber-50 border-2 border-dashed border-amber-200 py-4 px-5 rounded-xl my-6 not-italic',
      label: 'Helpful Tip'
    }
  }
  if (text.includes('good to know') || text.includes('warning')) {
    return {
      className: 'bg-orange-50 border-l-4 border-orange-300 py-4 px-5 rounded-r-xl my-6 not-italic',
      label: null
    }
  }
  if (text.includes('remember') || text.includes("you've got this") || text.includes('you can do')) {
    return {
      className: 'bg-pink-50 border-2 border-pink-200 py-4 px-5 rounded-xl my-6 not-italic',
      label: null
    }
  }
  if (text.includes('short version') || text.includes('milestone')) {
    return {
      className: 'bg-sky-50 border-l-4 border-sky-300 py-4 px-5 rounded-r-xl my-6 not-italic',
      label: null
    }
  }

  return {
    className: 'bg-sky-50 border-l-4 border-sky-300 py-4 px-5 rounded-r-xl my-6 not-italic',
    label: null
  }
}

export function PlanContent({ content }: PlanContentProps) {
  return (
    <div id="plan-content" className="plan-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-purple-700 text-center mb-8 pb-4 border-b-2 border-purple-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <div className="bg-sky-50 border-l-4 border-sky-400 rounded-r-xl py-4 px-6 mt-12 mb-6">
              <h2 className="text-xl font-bold text-purple-700 m-0">
                {children}
              </h2>
            </div>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-purple-600 mt-8 mb-4 pb-2 border-b border-purple-100">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold text-gray-700 mt-5 mb-3">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => {
            const { className, label } = getBlockquoteStyle(children)
            return (
              <blockquote className={className}>
                {label && (
                  <span className="block text-sm font-bold text-pink-500 uppercase tracking-wide mb-2">
                    {label}
                  </span>
                )}
                <div className="text-gray-600 text-base leading-relaxed [&>p]:m-0">
                  {children}
                </div>
              </blockquote>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-gray-200">
              <table className="min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-5 py-4 text-left text-sm font-bold text-purple-700 uppercase tracking-wide">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-amber-50/50">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="px-5 py-4 text-base text-gray-600">
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
          li: ({ node, children }) => {
            // Check if this is inside an ordered list by looking at parent
            const isOrdered = node?.position && content.slice(0, node.position.start.offset || 0).match(/\d+\.\s[^\n]*$/m)

            if (isOrdered) {
              return (
                <li className="bg-green-50 border-l-4 border-green-300 rounded-r-lg py-4 px-5 text-gray-600 text-base leading-relaxed">
                  {children}
                </li>
              )
            }

            return (
              <li className="flex gap-3 text-gray-600 text-base leading-relaxed pl-2">
                <span className="flex-shrink-0 text-pink-400 mt-1">♡</span>
                <span className="flex-1">{children}</span>
              </li>
            )
          },
          hr: () => (
            <div className="flex items-center justify-center gap-3 my-10">
              <div className="flex-1 h-0.5 bg-purple-100"></div>
              <div className="w-2 h-2 rounded-full bg-pink-300"></div>
              <div className="flex-1 h-0.5 bg-purple-100"></div>
            </div>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">{children}</strong>
          ),
          p: ({ children }) => {
            const text = String(children)
            // Special formatting for troubleshooting patterns
            if (text.startsWith('**If ') || text.match(/^\*\*If [^:]+:\*\*/)) {
              return (
                <p className="text-gray-600 text-base leading-relaxed my-4 pl-5 border-l-2 border-orange-200 bg-orange-50/50 py-3 pr-4 rounded-r">
                  {children}
                </p>
              )
            }
            return <p className="text-gray-600 text-base leading-relaxed my-4">{children}</p>
          },
          a: ({ href, children }) => (
            <a href={href} className="text-purple-600 hover:text-purple-800 underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
