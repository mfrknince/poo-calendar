import { useState, useEffect } from 'react'
import { ReviewCard } from './EvaluationPage'

const inputClass = 'w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white'

/** Last 7 local days (oldest first) with pee/poop counts from activity_log rows. */
function groupByDay(rows) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push({ date: d, pee: 0, poop: 0 })
  }
  rows.forEach((row) => {
    const key = new Date(row.created_at).toDateString()
    const day = days.find((d) => d.date.toDateString() === key)
    if (day) day[row.type]++
  })
  return days
}

function StatCard({ label, pee, poop }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">{label}</p>
      <div className="flex gap-4">
        <span className="text-2xl font-bold text-pee-400">{pee} <span className="text-lg">💧</span></span>
        <span className="text-2xl font-bold text-poop-400">{poop} <span className="text-lg">💩</span></span>
      </div>
    </div>
  )
}

function PasswordForm({ supabaseClient }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setMessage({ ok: false, text: 'Şifreler eşleşmiyor.' })
      return
    }
    setSaving(true)
    const { error } = await supabaseClient.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setMessage({ ok: false, text: 'Hata: ' + error.message })
    } else {
      setMessage({ ok: true, text: 'Şifreniz değiştirildi.' })
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">🔑 Şifre Değiştir</h3>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Yeni Şifre</label>
        <input type="password" required minLength={6} autoComplete="new-password" className={inputClass}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Yeni Şifre (Tekrar)</label>
        <input type="password" required minLength={6} autoComplete="new-password" className={inputClass}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {message && (
        <div className={`px-3 py-2 rounded-lg text-sm border ${
          message.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}
      <button type="submit" disabled={saving}
        className="bg-accent-500 hover:bg-accent-400 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
        {saving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
      </button>
    </form>
  )
}

export function ProfilePage({ supabaseClient, session, userRole }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ pee: 0, poop: 0 })
  const [myReviews, setMyReviews] = useState([])
  const user = session.user
  const username = user.user_metadata?.username || user.email.split('@')[0]

  useEffect(() => {
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - 6)
    supabaseClient
      .from('activity_log')
      .select('type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .then(({ data, error }) => {
        if (error) console.error('Activity fetch failed:', error)
        setRows(data || [])
        setLoading(false)
      })
    // All-time personal totals (the matrix on the main page is the team total)
    supabaseClient.rpc('my_totals').single().then(({ data, error }) => {
      if (error) console.error('Totals fetch failed:', error)
      else setTotals(data)
    })
    supabaseClient
      .from('toilet_reviews')
      .select('id, user_id, rating, comment, tags, created_at, toilets(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Reviews fetch failed:', error)
        else setMyReviews(data)
      })
  }, [supabaseClient, user.id])

  const days = groupByDay(rows)
  const today = days[days.length - 1]
  const week = days.reduce((sum, d) => ({ pee: sum.pee + d.pee, poop: sum.poop + d.poop }), { pee: 0, poop: 0 })
  const maxDay = Math.max(1, ...days.map((d) => d.pee + d.poop))

  return (
    <div className="w-full px-4 sm:px-6 flex-1 flex flex-col items-center pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-4 animate-fade-in-up">
        {/* Header */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="text-4xl select-none">👤</div>
          <div>
            <h2 className="text-xl font-bold text-white">{username}</h2>
            <p className="text-slate-400 text-sm">
              {userRole === 'admin' ? 'Yönetici' : 'Kullanıcı'} · Üyelik: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Bugün" pee={today.pee} poop={today.poop} />
          <StatCard label="Son 7 Gün" pee={week.pee} poop={week.poop} />
          <StatCard label="Toplam" pee={totals.pee} poop={totals.poop} />
        </div>

        {/* Daily breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">📅 Günlük Döküm</h3>
          {loading ? (
            <p className="text-slate-400 text-sm">Yükleniyor...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {days.map((d) => (
                <div key={d.date.toISOString()} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-400">
                    {d.date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 flex h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-pee-400" style={{ width: `${(d.pee / maxDay) * 100}%` }} />
                    <div className="bg-poop-400" style={{ width: `${(d.poop / maxDay) * 100}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-slate-300 tabular-nums">
                    {d.pee}💧 {d.poop}💩
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">🚽 Değerlendirmelerim</h3>
          {myReviews.length === 0 ? (
            <p className="text-slate-400 text-sm">Henüz tuvalet değerlendirmen yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myReviews.map((r) => (
                <ReviewCard key={r.id} review={r} toiletName={r.toilets?.name} />
              ))}
            </div>
          )}
        </div>

        <PasswordForm supabaseClient={supabaseClient} />
      </div>
    </div>
  )
}
