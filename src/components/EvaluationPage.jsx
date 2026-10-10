import { useTranslation } from 'react-i18next'

export function EvaluationPage() {
  const { t } = useTranslation()

  return (
    <div className="w-full px-4 sm:px-6 flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <div className="glass-card p-8 text-center max-w-md w-full animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4 text-white">🧻 Tuvalet Değerlendirme</h2>
        <p className="text-slate-400 mb-6">
          Buraya ileride Bristol dışkı skalası, renk seçimi ve not ekleme gibi detaylı değerlendirme formları gelecek.
        </p>
        <div className="flex items-center justify-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <span className="text-4xl animate-bounce">🚧</span>
        </div>
      </div>
    </div>
  )
}
