import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Action panel with Pee and Poop buttons.
 * Shows the current time and handles button presses with ripple effects.
 */
export function ActionPanel({ timeStr, onPee, onPoop }) {
  const { t } = useTranslation()
  const [pressing, setPressing] = useState(null)
  const [lastEmoji, setLastEmoji] = useState(null)
  const peeRef = useRef(null)
  const poopRef = useRef(null)

  const createRipple = (e, ref) => {
    const btn = ref.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.background = 'rgba(255,255,255,0.3)'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  const handlePee = async (e) => {
    createRipple(e, peeRef)
    setPressing('pee')
    setLastEmoji('💧')
    try {
      await onPee(timeStr)
    } catch {
      // handled in parent
    } finally {
      setTimeout(() => setPressing(null), 300)
      setTimeout(() => setLastEmoji(null), 500)
    }
  }

  const handlePoop = async (e) => {
    createRipple(e, poopRef)
    setPressing('poop')
    setLastEmoji('💩')
    try {
      await onPoop(timeStr)
    } catch {
      // handled in parent
    } finally {
      setTimeout(() => setPressing(null), 300)
      setTimeout(() => setLastEmoji(null), 500)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6" id="action-panel">
      <div className="glass-card p-6 flex flex-col items-center gap-4 relative overflow-hidden">
        {/* Floating emoji feedback */}
        {lastEmoji && (
          <div
            className="absolute text-4xl emoji-pop pointer-events-none"
            style={{ top: '10%', left: '50%', transform: 'translateX(-50%)' }}
          >
            {lastEmoji}
          </div>
        )}

        {/* Time display */}
        <p className="text-sm text-slate-400">
          {t('logAction')}{' '}
          <span className="font-mono font-bold text-white text-lg">{timeStr}</span>
        </p>

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            ref={peeRef}
            onClick={handlePee}
            disabled={pressing === 'pee'}
            className="btn-pee min-w-[140px]"
            id="btn-log-pee"
          >
            {t('pee')}
          </button>

          <button
            ref={poopRef}
            onClick={handlePoop}
            disabled={pressing === 'poop'}
            className="btn-poop min-w-[140px]"
            id="btn-log-poop"
          >
            {t('poop')}
          </button>
        </div>
      </div>
    </div>
  )
}
