import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const switchLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('poo-calendar-lang', lang)
  }

  return (
    <div className="lang-switch" id="language-switcher">
      <button
        onClick={() => switchLang('en')}
        className={i18n.language === 'en' ? 'active' : ''}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => switchLang('tr')}
        className={i18n.language === 'tr' ? 'active' : ''}
        aria-label="Türkçeye geç"
      >
        TR
      </button>
    </div>
  )
}
