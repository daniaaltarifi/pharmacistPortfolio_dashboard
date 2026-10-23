import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Check, CircleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (message, tone = 'ok') => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), tone === 'ok' ? 3500 : 6000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100vw-32px))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'bad' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium shadow-lg',
              t.tone === 'bad' ? 'border-bad/20 bg-bad-soft text-bad' : 'border-ok/20 bg-ok-soft text-ok',
            )}
          >
            {t.tone === 'bad' ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
