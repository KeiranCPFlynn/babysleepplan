export type ComparisonRow = {
  feature: string
  lunaCradle: string
  competitor: string
}

type ComparisonTableProps = {
  competitorLabel: string
  rows: ComparisonRow[]
}

export function ComparisonTable({ competitorLabel, rows }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/70">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Feature</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">LunaCradle</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{competitorLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-t border-slate-100 dark:border-slate-800 align-top">
              <th scope="row" className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                {row.feature}
              </th>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.lunaCradle}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
