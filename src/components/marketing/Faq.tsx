export type FaqItem = {
  question: string
  answer: string
}

type FaqProps = {
  title?: string
  items: FaqItem[]
  id?: string
}

export function faqToJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function Faq({ title = 'Frequently asked questions', items, id = 'faq' }: FaqProps) {
  return (
    <section id={id} className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
            <summary className="cursor-pointer list-none font-medium text-slate-900 dark:text-slate-100">
              {item.question}
            </summary>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
