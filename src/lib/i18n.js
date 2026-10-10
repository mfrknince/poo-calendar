import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Header
      appName: 'PooCalendar',
      appTagline: 'Fill the day, minute by minute 💩',
      live: 'LIVE',

      // Stats
      totalFilled: 'Total Filled',
      peeCount: 'Pee Count',
      poopCount: 'Poop Count',
      fillRate: 'Fill Rate',
      minutesOf: 'of 1440 min',

      // Buttons
      pee: '💧 Pee',
      poop: '💩 Poop',
      logAction: 'Log it at',

      // Heatmap
      heatmapTitle: '24-Hour Heatmap',
      hour: 'Hour',
      minute: 'Minute',
      noData: 'Empty',
      peeLabel: 'Pee',
      poopLabel: 'Poop',
      bothLabel: 'Both',

      // Legend
      legend: 'Legend',
      empty: 'Empty',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      intense: 'Intense',

      // Toast
      peeRecorded: '💧 Pee recorded at {{time}}!',
      poopRecorded: '💩 Poop recorded at {{time}}!',
      error: 'Something went wrong. Try again!',

      // Setup
      setupTitle: 'Connect to Supabase',
      setupDesc: 'Enter your Supabase credentials to start. You can find them in your Supabase Dashboard → Project Settings → API.',
      supabaseUrl: 'Supabase URL',
      supabaseKey: 'Anon Key',
      connect: 'Connect & Start',
      urlPlaceholder: 'https://xxxxx.supabase.co',
      keyPlaceholder: 'eyJhbGciOi...',

      // Footer
      madeWith: 'Made with 💩 & 💧',
      cooperative: 'A cooperative experiment',
    },
  },
  tr: {
    translation: {
      // Header
      appName: 'PooCalendar',
      appTagline: 'Günü dakika dakika doldurun 💩',
      live: 'CANLI',

      // Stats
      totalFilled: 'Toplam Dolu',
      peeCount: 'İdrar Sayısı',
      poopCount: 'Kaka Sayısı',
      fillRate: 'Doluluk Oranı',
      minutesOf: '/ 1440 dk',

      // Buttons
      pee: '💧 İşedim',
      poop: '💩 Sıçtım',
      logAction: 'Kaydet:',

      // Heatmap
      heatmapTitle: '24 Saatlik Isı Haritası',
      hour: 'Saat',
      minute: 'Dakika',
      noData: 'Boş',
      peeLabel: 'İşedi',
      poopLabel: 'Sıçtı',
      bothLabel: 'İkisi de',

      // Legend
      legend: 'Gösterge',
      empty: 'Boş',
      low: 'Az',
      medium: 'Orta',
      high: 'Yüksek',
      intense: 'Yoğun',

      // Toast
      peeRecorded: '💧 {{time}} saatinde işediğin kaydedildi!',
      poopRecorded: '💩 {{time}} saatinde sıçtığın kaydedildi!',
      error: 'Bir şeyler ters gitti. Tekrar deneyin!',

      // Setup
      setupTitle: 'Supabase Bağlantısı',
      setupDesc: 'Başlamak için Supabase bilgilerinizi girin. Supabase Dashboard → Project Settings → API kısmından bulabilirsiniz.',
      supabaseUrl: 'Supabase URL',
      supabaseKey: 'Anon Key',
      connect: 'Bağlan & Başla',
      urlPlaceholder: 'https://xxxxx.supabase.co',
      keyPlaceholder: 'eyJhbGciOi...',

      // Footer
      madeWith: '💩 & 💧 ile yapıldı',
      cooperative: 'Kooperatif bir deney',
    },
  },
}

// Detect browser language
const getBrowserLang = () => {
  const lang = navigator.language || navigator.languages?.[0] || 'en'
  return lang.startsWith('tr') ? 'tr' : 'en'
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('poo-calendar-lang') || getBrowserLang(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
