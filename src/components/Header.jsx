import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header({ fullTime }) {
  const { t } = useTranslation()

  return (
    <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="text-3xl select-none" aria-hidden="true">💩</div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
            {t('appName')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('appTagline')}</p>
        </div>
      </div>

      {/* Right side: time, live indicator, lang */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 text-emerald-400 inline-block" />
          <span className="text-xs font-semibold text-emerald-400 tracking-wider">{t('live')}</span>
        </div>

        {/* Current time */}
        <div
          className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums"
          id="current-time-display"
        >
          {fullTime}
        </div>

        {/* Language switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  )
}
