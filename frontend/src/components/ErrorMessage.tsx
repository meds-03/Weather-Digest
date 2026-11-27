import { CloudOff, RefreshCw } from 'lucide-react'
import { ApiError } from '../api'

interface ErrorMessageProps {
  error: unknown
  onRetry?: () => void
}

function getFriendlyMessage(error: unknown): { title: string; message: string } {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return {
          title: 'City not found',
          message: 'We could not find that city. Try another name.',
        }
      case 422:
        return {
          title: 'Check your search',
          message: 'Please enter a valid city name and try again.',
        }
      case 502:
      case 504:
        return {
          title: 'Weather service unavailable',
          message: 'The weather service is unavailable. Please try again soon.',
        }
      case 0:
        return {
          title: 'Connection problem',
          message: 'We could not connect to the weather service. Check your connection.',
        }
    }
  }

  return {
    title: 'Weather unavailable',
    message: 'We couldn’t load the weather right now. Please try again.',
  }
}

function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const friendlyMessage = getFriendlyMessage(error)

  return (
    <section
      aria-live="polite"
      className="flex animate-fade-in flex-col items-center rounded-3xl border border-white/70 bg-white/65 px-6 py-10 text-center shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:px-10"
      role="alert"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
        <CloudOff aria-hidden="true" size={26} />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {friendlyMessage.title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        {friendlyMessage.message}
      </p>
      {onRetry && (
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-100"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          Try again
        </button>
      )}
    </section>
  )
}

export default ErrorMessage
