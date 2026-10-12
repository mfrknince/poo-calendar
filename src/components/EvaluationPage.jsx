import { useState, useEffect, useCallback } from 'react'

// Bristol Stool Scale definitions
const BRISTOL_TYPES = [
  {
    type: 1,
    emoji: '🪨',
    name: 'Tip 1',
    desc: 'Ayrı sert topaklar',
    detail: 'Keçi dışkısı gibi — çok katı',
    color: '#8B4513',
    health: 'danger',
  },
  {
    type: 2,
    emoji: '🍫',
    name: 'Tip 2',
    desc: 'Sosis şeklinde, topaklanmış',
    detail: 'Fıstık kaplı çikolata gibi',
    color: '#A0522D',
    health: 'warning',
  },
  {
    type: 3,
    emoji: '🌭',
    name: 'Tip 3',
    desc: 'Sosis şeklinde, çatlak yüzey',
    detail: 'Sosisimitasyonu — kabul edilebilir',
    color: '#8B6914',
    health: 'ok',
  },
  {
    type: 4,
    emoji: '🍌',
    name: 'Tip 4',
    desc: 'Sosis ya da yılan gibi, pürüzsüz',
    detail: 'İDEAL TIP ✓ — Sağlıklı dışkı',
    color: '#6B8E23',
    health: 'ideal',
  },
  {
    type: 5,
    emoji: '🫐',
    name: 'Tip 5',
    desc: 'Belirgin kenarlı yumuşak parçalar',
    detail: 'Biraz fazla yumuşak — ok ama izle',
    color: '#DAA520',
    health: 'ok',
  },
  {
    type: 6,
    emoji: '🥣',
    name: 'Tip 6',
    desc: 'Pürüzlü kenarlı lifli parçalar',
    detail: 'Hafif ishal — dikkat et',
    color: '#CD853F',
    health: 'warning',
  },
  {
    type: 7,
    emoji: '💧',
    name: 'Tip 7',
    desc: 'Katı kısım yok, tamamen sıvı',
    detail: 'İshal — doktora başvur!',
    color: '#B22222',
    health: 'danger',
  },
]

const COLORS = [
  { label: 'Kahverengi', value: '#8B4513' },
  { label: 'Koyu Kahve', value: '#5C2E00' },
  { label: 'Sarı-Yeşil', value: '#9ACD32' },
  { label: 'Sarı', value: '#FFD700' },
  { label: 'Kırmızı', value: '#DC143C' },
  { label: 'Siyah', value: '#1a1a1a' },
  { label: 'Gri', value: '#808080' },
  { label: 'Beyaz/Bej', value: '#F5DEB3' },
]

const URGENCY_LABELS = ['', '😌 Sakin', '🙂 Hafif', '😅 Orta', '😣 Acil', '🚨 Çok Acil']

const HEALTH_STYLES = {
  ideal: 'border-emerald-400/60 bg-emerald-500/10',
  ok: 'border-yellow-400/50 bg-yellow-500/10',
  warning: 'border-orange-400/50 bg-orange-500/10',
  danger: 'border-red-400/50 bg-red-500/10',
}

const HEALTH_BADGE = {
  ideal: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ok: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  warning: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  danger: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const HEALTH_LABELS = {
  ideal: '✓ İdeal',
  ok: '⚠ Kabul Edilebilir',
  warning: '⚠ Dikkat',
  danger: '🚨 Endişe Verici',
}

function BristolCard({ item, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item.type)}
      className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? `${HEALTH_STYLES[item.health]} scale-[1.02] shadow-lg`
          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/70 hover:bg-slate-700/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{item.name}</span>
            {selected && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${HEALTH_BADGE[item.health]}`}>
                {HEALTH_LABELS[item.health]}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5">{item.desc}</p>
          <p className="text-slate-500 text-xs mt-1 italic">{item.detail}</p>
        </div>
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 mt-1 border-2 border-slate-600"
          style={{ backgroundColor: item.color }}
        />
      </div>
    </button>
  )
}

function EvalHistory({ evaluations, onDelete }) {
  if (!evaluations.length) {
    return (
      <div className="text-center py-8 text-slate-500">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">Henüz değerlendirme yok</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
      {evaluations.map((ev) => {
        const bristol = BRISTOL_TYPES.find((b) => b.type === ev.bristol_type)
        const colorInfo = COLORS.find((c) => c.value === ev.color)
        const date = new Date(ev.logged_at)
        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 group"
          >
            <span className="text-xl flex-shrink-0">
              {ev.type === 'poop' ? '💩' : '💧'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">
                  {date.toLocaleDateString('tr-TR')} {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {bristol && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${HEALTH_BADGE[bristol.health]}`}>
                    {bristol.emoji} {bristol.name}
                  </span>
                )}
                {ev.urgency && (
                  <span className="text-xs text-slate-400">{URGENCY_LABELS[ev.urgency]}</span>
                )}
              </div>
              {ev.notes && (
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{ev.notes}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {colorInfo && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-600 inline-block"
                      style={{ backgroundColor: colorInfo.value }}
                    />
                    {colorInfo.label}
                  </span>
                )}
                {ev.duration_minutes && (
                  <span className="text-xs text-slate-500">⏱ {ev.duration_minutes} dk</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onDelete(ev.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 flex-shrink-0"
            >
              🗑
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function EvaluationPage({ supabaseClient, session }) {
  const [type, setType] = useState('poop')
  const [bristolType, setBristolType] = useState(null)
  const [color, setColor] = useState(null)
  const [urgency, setUrgency] = useState(3)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeSection, setActiveSection] = useState('form')

  const loadHistory = useCallback(async () => {
    if (!supabaseClient || !session) return
    setLoadingHistory(true)
    const { data, error } = await supabaseClient
      .from('evaluations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('logged_at', { ascending: false })
      .limit(50)
    if (!error && data) setEvaluations(data)
    setLoadingHistory(false)
  }, [supabaseClient, session])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSubmit = async () => {
    if (!supabaseClient || !session) {
      setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      return
    }
    if (type === 'poop' && !bristolType) {
      setError('Lütfen bir Bristol tipi seçin.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      user_id: session.user.id,
      type,
      logged_at: new Date().toISOString(),
      urgency: urgency || null,
      notes: notes.trim() || null,
      color: color || null,
      duration_minutes: duration ? parseInt(duration, 10) : null,
      bristol_type: type === 'poop' ? bristolType : null,
    }

    const { error: insertError } = await supabaseClient.from('evaluations').insert(payload)

    if (insertError) {
      setError(`Kayıt hatası: ${insertError.message}`)
      setSaving(false)
      return
    }

    setSuccess(true)
    setBristolType(null)
    setColor(null)
    setUrgency(3)
    setDuration('')
    setNotes('')
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
    loadHistory()
  }

  const handleDelete = async (id) => {
    if (!supabaseClient) return
    await supabaseClient.from('evaluations').delete().eq('id', id)
    setEvaluations((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="w-full px-4 sm:px-6 flex-1 flex flex-col items-center gap-4 pb-8">
      {/* Page Header */}
      <div className="w-full max-w-2xl">
        <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🧻 Tuvalet Değerlendirmesi
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Bristol dışkı skalası ile detaylı kayıt
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveSection('form')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'form'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✏️ Yeni Kayıt
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'history'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 Geçmiş {evaluations.length > 0 && `(${evaluations.length})`}
            </button>
          </div>
        </div>
      </div>

      {activeSection === 'form' ? (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {/* Type Selection */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Tuvalet Tipi
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => { setType('poop'); setBristolType(null) }}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  type === 'poop'
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                    : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                💩 Sıçtım
              </button>
              <button
                onClick={() => { setType('pee'); setBristolType(null) }}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  type === 'pee'
                    ? 'border-sky-500/60 bg-sky-500/10 text-sky-300'
                    : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                💧 İşedim
              </button>
            </div>
          </div>

          {/* Bristol Scale - only for poop */}
          {type === 'poop' && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Bristol Dışkı Skalası
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Dışkınızın şekline en yakın tipi seçin
              </p>
              <div className="flex flex-col gap-2">
                {BRISTOL_TYPES.map((item) => (
                  <BristolCard
                    key={item.type}
                    item={item}
                    selected={bristolType === item.type}
                    onSelect={setBristolType}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              {type === 'poop' ? 'Renk' : 'İdrar Rengi'}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(color === c.value ? null : c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs ${
                    color === c.value
                      ? 'border-white/40 bg-white/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border-2 border-slate-600"
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-slate-300 text-center leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Aciliyet Seviyesi
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgency(level)}
                  className={`flex-1 min-w-[60px] py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                    urgency === level
                      ? level <= 2
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300'
                        : level === 3
                        ? 'border-yellow-400/60 bg-yellow-500/10 text-yellow-300'
                        : 'border-red-400/60 bg-red-500/10 text-red-300'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {URGENCY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Notes */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Detaylar
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  ⏱ Süre (dakika, opsiyonel)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Kaç dakika?"
                  className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 flex justify-between">
                  <span>📝 Notlar (opsiyonel)</span>
                  <span className={notes.length > 400 ? 'text-red-400' : 'text-slate-600'}>
                    {notes.length}/500
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Nasıldı? Ne hissettirdi? Yediğin bir şeyle bağlantılı mı?"
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || (type === 'poop' && !bristolType)}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
              success
                ? 'bg-emerald-600/80 border-2 border-emerald-400/60 text-white'
                : type === 'poop' && !bristolType
                ? 'bg-slate-700/50 border-2 border-slate-600/50 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 active:scale-[0.98]'
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </span>
            ) : success ? (
              '✅ Kaydedildi!'
            ) : (
              `💾 Değerlendirmeyi Kaydet`
            )}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Değerlendirme Geçmişi
              </h3>
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50"
              >
                {loadingHistory ? '⟳' : '🔄 Yenile'}
              </button>
            </div>
            <EvalHistory evaluations={evaluations} onDelete={handleDelete} />
          </div>
        </div>
      )}
    </div>
  )
}
