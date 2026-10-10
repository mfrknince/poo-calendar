import { useState } from 'react'

export function AuthScreen({ supabaseClient, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Map username to a fake email since Supabase requires email for password auth
      const fakeEmail = `${username}@poocalendar.local`
      
      if (isLogin) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: fakeEmail,
          password,
        })
        if (error) throw error
        if (data.session) onLogin(data.session)
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email: fakeEmail,
          password,
          options: {
            data: { username }
          }
        })
        if (error) throw error
        if (data.session) {
          onLogin(data.session)
        } else {
          // Sometimes signUp requires email confirmation depending on settings
          setError('Kayıt başarılı! Lütfen emailinizi kontrol edin veya giriş yapın.')
          setIsLogin(true)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="glass-card p-6 sm:p-8 w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💩</div>
          <h1 className="text-2xl font-bold text-white mb-2">PooCalendar</h1>
          <p className="text-sm text-slate-400">
            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
              placeholder="kullanici_adi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              Şifre
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-500 hover:bg-accent-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bekleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className="ml-2 text-accent-400 hover:text-accent-300 font-medium"
          >
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  )
}
