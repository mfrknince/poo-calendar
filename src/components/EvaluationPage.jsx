import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TAGS = ['💩 Sıçılır', '☝️ 1 kere sıçarsın', '🚨 Acil durum', '☠️ Sıçma öl']
const DEFAULT_CENTER = [41.0082, 28.9784] // İstanbul

const average = (reviews) =>
  reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

const markerColor = (avg) =>
  avg === null ? '#94a3b8' : avg >= 4 ? '#22c55e' : avg >= 2.5 ? '#f59e0b' : '#ef4444'

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange(n)}
          className={`text-2xl transition-transform ${onChange ? 'hover:scale-110' : 'cursor-default'} ${
            n <= value ? '' : 'grayscale opacity-30'
          }`}
          aria-label={`${n} puan`}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

function ReviewForm({ isNew, myReview, onSave, onDelete }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(myReview?.rating || 0)
  const [tags, setTags] = useState(myReview?.tags || [])
  const [comment, setComment] = useState(myReview?.comment || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const toggleTag = (tag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return setError('Lütfen 1-5 arası puan verin.')
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), rating, tags, comment: comment.trim() })
    } catch (err) {
      setError('Kayıt hatası: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isNew && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Tuvalet Adı</label>
          <input
            required
            maxLength={100}
            placeholder="ör. Kadıköy Metro WC"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Puanın</label>
        <Stars value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Etiketler</label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                tags.includes(tag)
                  ? 'bg-accent-500/20 border-accent-500/50 text-white'
                  : 'border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Yorum</label>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Temizlik, kağıt, kuyruk..."
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      <div className="flex gap-3">
        {myReview && (
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 bg-slate-800 hover:bg-red-500/20 text-red-400 font-medium py-2.5 rounded-lg transition-colors"
          >
            Değerlendirmemi Sil
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-accent-500 hover:bg-accent-400 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : myReview ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}

/** One review row; used in the evaluation list, toilet modal and Profilim. */
export function ReviewCard({ review, toiletName, isMine, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-sm flex flex-col gap-2 ${
        onClick ? 'hover:bg-slate-800/70 transition-colors' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          {toiletName && <div className="font-semibold text-white truncate">🚽 {toiletName}</div>}
          <div className="text-xs">
            {'⭐'.repeat(review.rating)}
            <span className="text-slate-500"> {review.rating}/5{isMine && ' · Sen'}</span>
          </div>
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {new Date(review.created_at).toLocaleDateString('tr-TR')}
        </span>
      </div>
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">{tag}</span>
          ))}
        </div>
      )}
      {review.comment && <div className="text-slate-200 whitespace-pre-wrap break-words">{review.comment}</div>}
    </Tag>
  )
}

function ToiletDetails({ toilet, userId }) {
  const avg = average(toilet.toilet_reviews)
  const tagCounts = TAGS.map((tag) => [tag, toilet.toilet_reviews.filter((r) => r.tags.includes(tag)).length])
    .filter(([, count]) => count > 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Stars value={Math.round(avg || 0)} />
        <span className="text-slate-300 text-sm">
          {avg === null ? 'Henüz puan yok' : `${avg.toFixed(1)} / 5 · ${toilet.toilet_reviews.length} değerlendirme`}
        </span>
      </div>
      {tagCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagCounts.map(([tag, count]) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
              {tag} <span className="text-slate-500">×{count}</span>
            </span>
          ))}
        </div>
      )}
      {toilet.toilet_reviews.map((r) => (
        <ReviewCard key={r.id} review={r} isMine={r.user_id === userId} />
      ))}
    </div>
  )
}

/** Native <dialog>: backdrop, Esc-to-close and focus trap for free. */
function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] p-0 rounded-2xl bg-slate-900 border border-slate-700/50 text-white backdrop:bg-black/60"
    >
      {open && (
        <div className="p-6 flex flex-col gap-5">
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm" aria-label="Kapat">✕</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

function ToiletMap({ toilets, draft, setDraft, setSelectedId }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [locateError, setLocateError] = useState(null)

  // Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    map.on('click', (e) => {
      setSelectedId(null)
      setDraft(e.latlng)
    })
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => map.remove()
  }, [setDraft, setSelectedId])

  // Redraw markers
  useEffect(() => {
    const layer = layerRef.current
    layer.clearLayers()
    toilets.forEach((t) => {
      const avg = average(t.toilet_reviews)
      L.circleMarker([t.lat, t.lng], {
        radius: 9,
        color: '#0f172a',
        weight: 2,
        fillColor: markerColor(avg),
        fillOpacity: 0.9,
        bubblingMouseEvents: false,
      })
        .bindTooltip(`${t.name}${avg === null ? '' : ` · ${avg.toFixed(1)}⭐`}`)
        .on('click', () => {
          setDraft(null)
          setSelectedId(t.id)
        })
        .addTo(layer)
    })
    if (draft) {
      L.circleMarker([draft.lat, draft.lng], { radius: 10, color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 })
        .addTo(layer)
    }
  }, [toilets, draft, setDraft, setSelectedId])

  const locateMe = () =>
    navigator.geolocation?.getCurrentPosition(
      (pos) => mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16),
      () => setLocateError('Konum alınamadı.'),
    )

  return (
    // relative z-0 keeps Leaflet's high z-index panes below toasts
    <div className="relative z-0 w-full flex flex-col gap-2">
      <div ref={containerRef} className="h-[60dvh] min-h-80 w-full rounded-xl overflow-hidden border border-glass-border" />
      <button
        onClick={locateMe}
        className="absolute top-3 right-3 z-[1000] px-3 py-2 rounded-lg text-sm bg-slate-900/90 hover:bg-slate-800 text-white shadow-lg"
      >
        📍 Konumum
      </button>
      {locateError && <p className="text-red-400 text-sm">{locateError}</p>}
    </div>
  )
}

export function EvaluationPage({ supabaseClient, session }) {
  const [view, setView] = useState('list')
  const [toilets, setToilets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null) // { lat, lng } of a new toilet being added
  const [error, setError] = useState(null)
  const userId = session.user.id

  // ponytail: loads every toilet + review at once; add bbox filtering if it grows past a few thousand
  const load = useCallback(async () => {
    const { data, error } = await supabaseClient
      .from('toilets')
      .select('id, name, lat, lng, toilet_reviews(id, user_id, rating, comment, tags, created_at)')
    if (error) setError(error.message)
    else setToilets(data)
  }, [supabaseClient])

  useEffect(() => {
    load()
  }, [load])

  const reviews = toilets
    .flatMap((t) => t.toilet_reviews.map((r) => ({ ...r, toilet: t })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const selected = toilets.find((t) => t.id === selectedId)
  const myReview = selected?.toilet_reviews.find((r) => r.user_id === userId)

  const closeModal = () => {
    setDraft(null)
    setSelectedId(null)
  }

  const handleSave = async ({ name, rating, tags, comment }) => {
    let toiletId = selectedId
    if (draft) {
      const { data, error } = await supabaseClient
        .from('toilets')
        .insert({ name, lat: draft.lat, lng: draft.lng })
        .select('id')
        .single()
      if (error) throw error
      toiletId = data.id
    }
    const { error } = await supabaseClient
      .from('toilet_reviews')
      .upsert({ toilet_id: toiletId, user_id: userId, rating, tags, comment: comment || null }, { onConflict: 'toilet_id,user_id' })
    if (error) throw error
    await load()
    closeModal()
  }

  const handleDelete = async () => {
    const { error } = await supabaseClient.from('toilet_reviews').delete().eq('id', myReview.id)
    if (error) setError(error.message)
    else load()
  }

  const tabClass = (v) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      view === v ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
    }`

  return (
    <div className="w-full px-4 sm:px-6 flex-1 flex flex-col items-center gap-4 pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-4 animate-fade-in-up">
        <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">🚽 Tuvalet Değerlendirme</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {view === 'list' ? 'Ekibin tüm değerlendirmeleri' : 'Yeni eklemek için haritada bir yere tıkla'}
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <button onClick={() => setView('list')} className={tabClass('list')}>
              📋 Liste {reviews.length > 0 && `(${reviews.length})`}
            </button>
            <button onClick={() => setView('map')} className={tabClass('map')}>🗺️ Harita</button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {view === 'list' ? (
          <div className="flex flex-col gap-3">
            {reviews.length === 0 && (
              <div className="glass-card p-8 text-center text-slate-400 text-sm">
                Henüz değerlendirme yok.{' '}
                <button onClick={() => setView('map')} className="text-accent-400 hover:text-accent-300">
                  Haritadan ilkini ekle →
                </button>
              </div>
            )}
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                toiletName={r.toilet.name}
                isMine={r.user_id === userId}
                onClick={() => setSelectedId(r.toilet.id)}
              />
            ))}
          </div>
        ) : (
          <ToiletMap toilets={toilets} draft={draft} setDraft={setDraft} setSelectedId={setSelectedId} />
        )}
      </div>

      <Modal open={!!(selected || draft)} onClose={closeModal} title={draft ? '✨ Yeni Değerlendirme' : `🚽 ${selected?.name}`}>
        {selected && <ToiletDetails toilet={selected} userId={userId} />}
        <div className={selected ? 'border-t border-slate-700/50 pt-5' : ''}>
          {selected && <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Senin değerlendirmen</p>}
          <ReviewForm
            key={draft ? `${draft.lat},${draft.lng}` : `${selectedId}-${myReview?.id}`}
            isNew={!!draft}
            myReview={myReview}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </div>
      </Modal>
    </div>
  )
}
