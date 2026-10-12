import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Determines the color of a heatmap cell based on its pee/poop counts.
 * Returns CSS color string and a category for the legend.
 */
export function getCellColor(peeCount, poopCount) {
  const total = peeCount + poopCount

  if (total === 0) {
    return { color: 'rgba(30, 41, 59, 0.5)', category: 'empty' }
  }

  const hasPee = peeCount > 0
  const hasPoop = poopCount > 0

  // Both types present → combined warm tone
  if (hasPee && hasPoop) {
    const intensity = Math.min(total / 8, 1)
    const alpha = 0.3 + intensity * 0.7
    return {
      color: `rgba(224, 122, 95, ${alpha})`,
      category: 'both',
    }
  }

  // Pee only → golden amber scale
  if (hasPee) {
    const intensity = Math.min(peeCount / 5, 1)
    const alpha = 0.3 + intensity * 0.7
    return {
      color: `rgba(250, 204, 21, ${alpha})`,
      category: 'pee',
    }
  }

  // Poop only → rich brown scale
  const intensity = Math.min(poopCount / 5, 1)
  const alpha = 0.3 + intensity * 0.7
  return {
    color: `rgba(184, 115, 51, ${alpha})`,
    category: 'poop',
  }
}

/**
 * GitHub-style 24-hour heatmap component.
 * Renders 24 rows (hours) × 60 columns (minutes) = 1440 cells.
 */
export function Heatmap({ matrix, selected, onSelect }) {
  const { t } = useTranslation()
  const [hoveredCell, setHoveredCell] = useState(null)

  // Generate the grid data
  const hours = useMemo(() => {
    const result = []
    for (let h = 0; h < 24; h++) {
      const minutes = []
      for (let m = 0; m < 60; m++) {
        const id = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const data = matrix.get(id) || { pee_count: 0, poop_count: 0 }
        const { color, category } = getCellColor(data.pee_count, data.poop_count)
        minutes.push({ id, ...data, color, category })
      }
      result.push({ hour: h, minutes })
    }
    return result
  }, [matrix])

  const handleMouseEnter = useCallback((cell) => {
    setHoveredCell(cell)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null)
  }, [])

  return (
    <div className="w-full px-4 sm:px-6" id="heatmap-section">
      <div className="glass-card p-4 sm:p-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {t('heatmapTitle')}
          </h2>

          {/* Hover info */}
          {hoveredCell && (
            <div className="text-xs font-mono text-slate-400 animate-fade-in-up" style={{ animationDuration: '0.15s' }}>
              <span className="text-white font-bold">{hoveredCell.id}</span>
              <span className="mx-2">·</span>
              <span className="text-pee-400">💧 {hoveredCell.pee_count}</span>
              <span className="mx-1.5">·</span>
              <span className="text-poop-400">💩 {hoveredCell.poop_count}</span>
            </div>
          )}
        </div>

        {/* Grid container */}
        <div className="w-full overflow-x-auto pb-4 flex justify-center">
          <div className="inline-flex flex-col gap-[2px] min-w-fit px-2">
            {/* Minute labels - top (every 5 min) */}
            <div className="flex items-center gap-[2px] mb-2">
              <div className="w-8 shrink-0" /> {/* hour label spacer */}
              {Array.from({ length: 60 }, (_, m) => (
                <div
                  key={`label-${m}`}
                  className="text-center shrink-0"
                  style={{ width: 'var(--spacing-cell)' }}
                >
                  {m % 10 === 0 && (
                    <span className="text-[6px] text-slate-600 font-mono leading-none">
                      {m}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Rows */}
            {hours.map((hourData) => (
              <div key={hourData.hour} className="flex items-center gap-[2px]">
                {/* Hour label */}
                <div className="w-8 shrink-0 text-right pr-2">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {String(hourData.hour).padStart(2, '0')}
                  </span>
                </div>

                {/* Minute cells */}
                {hourData.minutes.map((cell) => {
                  const isCurrent = cell.id === selected
                  return (
                    <div
                      key={cell.id}
                      className="heatmap-cell shrink-0 cursor-pointer"
                      style={{
                        backgroundColor: cell.color,
                        outline: isCurrent ? '2px solid rgba(255,255,255,0.8)' : 'none',
                        outlineOffset: isCurrent ? '-1px' : 0,
                        zIndex: isCurrent ? 10 : 'auto',
                      }}
                      onClick={() => onSelect(cell.id)}
                      onMouseEnter={() => handleMouseEnter(cell)}
                      onMouseLeave={handleMouseLeave}
                      title={`${cell.id} — 💧${cell.pee_count} 💩${cell.poop_count}`}
                      aria-label={`${cell.id}: ${cell.pee_count} pee, ${cell.poop_count} poop`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="font-medium text-slate-500">{t('legend')}:</span>
          <LegendItem color="rgba(30, 41, 59, 0.5)" label={t('empty')} />
          <LegendItem color="rgba(250, 204, 21, 0.4)" label={`💧 ${t('low')}`} />
          <LegendItem color="rgba(250, 204, 21, 0.7)" label={`💧 ${t('medium')}`} />
          <LegendItem color="rgba(250, 204, 21, 1)" label={`💧 ${t('high')}`} />
          <LegendItem color="rgba(184, 115, 51, 0.5)" label={`💩 ${t('low')}`} />
          <LegendItem color="rgba(184, 115, 51, 1)" label={`💩 ${t('high')}`} />
          <LegendItem color="rgba(224, 122, 95, 0.7)" label={t('bothLabel')} />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  )
}
