'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getTextContent).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent((children as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ''
}

const components: Components = {
  h2: ({ children }) => {
    const id = slugify(getTextContent(children))
    return (
      <h2 id={id} className="text-2xl font-bold text-slate-900 mt-10 mb-4">{children}</h2>
    )
  },
  h3: ({ children }) => {
    const id = slugify(getTextContent(children))
    return (
      <h3 id={id} className="text-xl font-semibold text-slate-800 mt-8 mb-3">{children}</h3>
    )
  },
  p: ({ children }) => (
    <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2 mb-4 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 mb-4 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-slate-600 leading-relaxed pl-2">
      <span className="inline text-sky-500 mr-2">&bull;</span>
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-sky-300 pl-4 py-1 my-4 bg-sky-50/50 rounded-r-lg">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sky-700 underline underline-offset-2 hover:text-sky-900 transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-white/60">
      <table className="w-full text-sm text-left text-slate-600">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 bg-sky-50 font-semibold text-slate-800 border-b border-white/60">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-b border-white/40">{children}</td>
  ),
  em: ({ children }) => (
    <em className="text-slate-500 italic">{children}</em>
  ),
  hr: () => (
    <hr className="my-8 border-white/60" />
  ),
}

export function PostContent({ content }: { content: string }) {
  return (
    <div className="prose-custom max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
