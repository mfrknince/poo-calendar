import { useState, useEffect, useCallback } from 'react'

/**
 * Toast notification system.
 * Shows temporary messages at the bottom of the screen.
 */
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const bgColor = toast.type === 'pee'
    ? 'rgba(250, 204, 21, 0.15)'
    : toast.type === 'poop'
    ? 'rgba(184, 115, 51, 0.15)'
    : 'rgba(239, 68, 68, 0.15)'

  const borderColor = toast.type === 'pee'
    ? 'var(--color-pee-500)'
    : toast.type === 'poop'
    ? 'var(--color-poop-500)'
    : '#ef4444'

  return (
    <div
      onClick={() => {
        if (!exiting) {
          setExiting(true)
          setTimeout(() => onDismiss(toast.id), 300)
        }
      }}
      className={`cursor-pointer pointer-events-auto px-5 py-3 rounded-xl backdrop-blur-lg text-sm font-medium text-white shadow-lg ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        minWidth: '240px',
        textAlign: 'center',
      }}
    >
      {toast.message}
    </div>
  )
}

/**
 * Hook for managing toasts.
 */
let toastIdCounter = 0

export function useToasts() {
  const [toasts, setToasts] = useState([])

  // Stable callbacks: App re-renders every second (clock), and a new onDismiss
  // identity would restart each toast's auto-hide timer forever
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter
    // Only keep one toast at a time
    setToasts([{ id, message, type }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}
