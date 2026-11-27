function CurrentWeatherSkeleton() {
  return (
    <div
      aria-label="Loading current weather"
      aria-busy="true"
      className="animate-pulse rounded-3xl border border-white/70 bg-white/60 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 sm:p-9"
      role="status"
    >
      <span className="sr-only">Loading current weather...</span>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-5">
          <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-20 w-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
          <div className="size-28 rounded-full bg-slate-200 dark:bg-slate-700 sm:size-36" />
          <div className="h-14 w-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  )
}

export default CurrentWeatherSkeleton
