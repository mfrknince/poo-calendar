import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/i18n'
import './index.css'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import { loadAppSettings } from './lib/supabaseFactory'

loadAppSettings().then(() =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  ),
)
