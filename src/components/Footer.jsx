import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="w-full px-4 sm:px-6 py-6 mt-auto">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-slate-500">
          {t('madeWith')}
        </p>
        <p className="text-[10px] text-slate-600">
          {t('cooperative')}
        </p>
      </div>
    </footer>
  )
}
