import { useState, useEffect } from 'react'
import { Heatmap, getCellColor } from './Heatmap'

const EMPTY = { pee_count: 0, poop_count: 0 }

function Toggle({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        on ? 'bg-accent-500/20 border-accent-500/50 text-white' : 'border-slate-700/50 text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

/** Who logged what in one minute (minute_details RPC: team usernames + counts). */
function MinuteRecords({ supabaseClient, minute, version }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    supabaseClient.rpc('minute_details', { minute_id: minute }).then(({ data, error }) => {
      if (error) console.error('Minute details failed:', error)
      setRows(data || [])
    })
  }, [supabaseClient, minute, version])

  if (!rows) return <p className="text-slate-500 text-sm">Yükleniyor...</p>
  if (!rows.length) return <p className="text-slate-400 text-sm">Bu dakikada henüz kayıt yok. İlk sen ol! 🚀</p>

  return (
    <ul className="w-full max-w-sm flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.username} className="flex justify-between items-center px-4 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-sm">
          <span className="text-white font-medium truncate">👤 {r.username}</span>
          <span className="shrink-0 tabular-nums">
            {r.pee > 0 && <span className="text-pee-400 ml-3">💧 {r.pee}</span>}
            {r.poop > 0 && <span className="text-poop-400 ml-3">💩 {r.poop}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function HourGrid({ matrix, selected, onSelect }) {
  const hour = selected.slice(0, 2)
  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        🕐 {hour}:00 – {hour}:59
      </h3>
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
        {Array.from({ length: 60 }, (_, m) => {
          const id = `${hour}:${String(m).padStart(2, '0')}`
          const data = matrix.get(id) || EMPTY
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] leading-tight transition-transform hover:scale-105 ${
                id === selected ? 'ring-2 ring-white' : ''
              }`}
              style={{ backgroundColor: getCellColor(data.pee_count, data.poop_count).color }}
              title={`${id} — 💧${data.pee_count} 💩${data.poop_count}`}
            >
              <span className="font-mono font-bold text-white text-xs">:{String(m).padStart(2, '0')}</span>
              {data.pee_count > 0 && <span>💧{data.pee_count}</span>}
              {data.poop_count > 0 && <span>💩{data.poop_count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Main-page matrix: the selected minute (defaults to now) as one big cell with who-did-what,
 * plus toggles for that hour's 60 minutes and the full 24h heatmap.
 */
export function MatrixPanel({ supabaseClient, matrix, currentTimeStr }) {
  const [picked, setPicked] = useState(null)
  const [showHour, setShowHour] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const selected = picked ?? currentTimeStr
  const data = matrix.get(selected) || EMPTY
  const { color } = getCellColor(data.pee_count, data.poop_count)

  return (
    <div className="w-full px-4 sm:px-6 flex flex-col gap-4">
      <div className="glass-card p-6 flex flex-col items-center gap-5">
        <div
          className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 border-white/20 shadow-xl"
          style={{ backgroundColor: color, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <span className="font-mono text-5xl font-bold text-white">{selected}</span>
          <span className="text-lg text-white font-semibold">
            💧 {data.pee_count} · 💩 {data.poop_count}
          </span>
        </div>

        {picked && (
          <button onClick={() => setPicked(null)} className="text-sm text-accent-400 hover:text-accent-300">
            ⏱ Şimdiye dön ({currentTimeStr})
          </button>
        )}

        <MinuteRecords
          supabaseClient={supabaseClient}
          minute={selected}
          version={`${data.pee_count}-${data.poop_count}`}
        />

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Toggle on={showHour} onClick={() => setShowHour((v) => !v)}>🕐 Bu saatin detayları</Toggle>
          <Toggle on={showAll} onClick={() => setShowAll((v) => !v)}>🗓️ Tüm matris</Toggle>
        </div>
      </div>

      {showHour && <HourGrid matrix={matrix} selected={selected} onSelect={setPicked} />}
      {showAll && (
        <div className="-mx-4 sm:-mx-6">
          <Heatmap matrix={matrix} selected={selected} onSelect={setPicked} />
        </div>
      )}
    </div>
  )
}
