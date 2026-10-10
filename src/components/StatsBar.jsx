import { useTranslation } from 'react-i18next'

export function StatsBar({ stats }) {
  const { t } = useTranslation()
  const fillPercent = parseFloat(stats.fillRate) || 0

  return (
    <div className="w-full px-4 sm:px-6" id="stats-bar">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {/* Total Filled */}
        <div className="glass-card stat-card-total p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('totalFilled')}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white count-animate">
              {stats.filledMinutes.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{t('minutesOf')}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar-animated"
              style={{
                width: `${fillPercent}%`,
                background: `linear-gradient(90deg, var(--color-accent-500), var(--color-pee-400))`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats.fillRate}%</p>
        </div>

        {/* Pee Count */}
        <div className="glass-card stat-card-pee p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('peeCount')}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-pee-400 count-animate">
              {stats.totalPee.toLocaleString()}
            </span>
            <span className="text-lg select-none">💧</span>
          </div>
        </div>

        {/* Poop Count */}
        <div className="glass-card stat-card-poop p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('poopCount')}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-poop-400 count-animate">
              {stats.totalPoop.toLocaleString()}
            </span>
            <span className="text-lg select-none">💩</span>
          </div>
        </div>

        {/* Fill Rate */}
        <div className="glass-card p-4" style={{ borderLeft: '3px solid var(--color-success-400)' }}>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('fillRate')}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-white count-animate">
              {stats.fillRate}
            </span>
            <span className="text-lg font-bold text-slate-500">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
