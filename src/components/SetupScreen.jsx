import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * Setup screen shown when Supabase credentials are not configured.
 * Allows users to enter their Supabase URL and Anon Key.
 */
export function SetupScreen({ onConnect }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim() || !key.trim()) return

    setIsConnecting(true)
    setError(null)

    try {
      await onConnect(url.trim(), key.trim())
    } catch (err) {
      setError(err.message || 'Connection failed')
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full animate-fade-in-up">
        {/* Language switcher top-right */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 select-none">💩</div>
          <h1 className="text-2xl font-bold text-white">{t('appName')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('appTagline')}</p>
        </div>

        {/* Setup form */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">{t('setupTitle')}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{t('setupDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t('supabaseUrl')}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('urlPlaceholder')}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
              required
              id="input-supabase-url"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t('supabaseKey')}
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('keyPlaceholder')}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
              required
              id="input-supabase-key"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !url.trim() || !key.trim()}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-pee-500))',
              color: 'white',
            }}
            id="btn-connect"
          >
            {isConnecting ? '...' : t('connect')}
          </button>
        </form>

        {/* SQL Reminder */}
        <div className="mt-6 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            💡 Make sure you've run the SQL migration first to create the minutes_matrix table with 1440 rows.
          </p>
        </div>
      </div>
    </div>
  )
}
