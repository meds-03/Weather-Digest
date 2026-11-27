import type { ApiMeta } from '../api'

interface DevStripProps {
  meta: ApiMeta
}

function DevStrip({ meta }: DevStripProps) {
  const isCacheHit = meta.cache === 'HIT'

  return (
    <div
      aria-label="Request details"
      className="flex animate-fade-in flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 py-3 text-xs font-medium text-slate-500 dark:text-slate-400"
    >
      <span>Status {meta.status}</span>
      <span>{Math.round(meta.ms)} ms</span>
      <span
        className={`rounded-full px-2.5 py-1 font-semibold ${
          isCacheHit
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}
      >
        {isCacheHit ? 'HIT' : 'MISS'}
      </span>
    </div>
  )
}

export default DevStrip
