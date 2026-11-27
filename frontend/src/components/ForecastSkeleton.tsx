function ForecastSkeleton() {
  return (
    <div
      aria-label="Loading forecast"
      aria-busy="true"
      className="animate-pulse space-y-5"
      role="status"
    >
      <span className="sr-only">Loading forecast...</span>
      <div
        aria-hidden="true"
        className="flex snap-x gap-3 overflow-hidden sm:gap-4"
      >
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-44 min-w-[138px] flex-1 rounded-3xl border border-white/70 bg-white/60 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
            key={item}
          />
        ))}
      </div>
      <div className="h-72 rounded-3xl border border-white/70 bg-white/60 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60" />
    </div>
  )
}

export default ForecastSkeleton
