import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { Heatmap } from './components/Heatmap'
import { ActionPanel } from './components/ActionPanel'
import { Footer } from './components/Footer'
import { SetupScreen } from './components/SetupScreen'
import { AuthScreen } from './components/AuthScreen'
import { AdminPanel } from './components/AdminPanel'
import { ToastContainer, useToasts } from './components/Toast'
import { EvaluationPage } from './components/EvaluationPage'
import { ProfilePage } from './components/ProfilePage'
import { useCurrentTime } from './hooks/useCurrentTime'
import { useMinutesMatrixWithClient } from './hooks/useMinutesMatrixWithClient'
import { testConnection, saveConfig, createConfiguredClient } from './lib/supabaseFactory'

function App() {
  const { t } = useTranslation()
  const { timeStr, fullTime } = useCurrentTime()
  const { toasts, addToast, dismissToast } = useToasts()

  // Supabase client & session state
  // Connects straight away with the default (.env) or admin-saved config
  const [supabaseClient, setSupabaseClient] = useState(createConfiguredClient)
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const isSetup = !supabaseClient

  // Tabs state
  const [activeTab, setActiveTab] = useState('general')

  // Listen for auth changes
  useEffect(() => {
    if (!supabaseClient) return
    
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Next login (any user) starts on the main page
      if (!session) setActiveTab('general')
    })

    return () => subscription.unsubscribe()
  }, [supabaseClient])

  // Fetch user role when session changes
  useEffect(() => {
    if (!supabaseClient || !session) {
      setUserRole('user')
      return
    }

    // Attempt to get role from profiles table
    supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setUserRole(data.role)
        } else {
          // Fallback check if it's the admin username in metadata
          if (session.user.user_metadata?.username === 'admin') {
            setUserRole('admin')
          }
        }
      })
  }, [supabaseClient, session])

  // Minutes matrix data
  const { matrix, stats, isLoading, error: matrixError, logPee, logPoop } =
    useMinutesMatrixWithClient(supabaseClient, session)

  // Handle setup connection
  const handleConnect = useCallback(async (url, key) => {
    const client = await testConnection(url, key)
    saveConfig(url, key)
    setSupabaseClient(client)
  }, [])

  // Handle pee action
  const handlePee = useCallback(async (time) => {
    try {
      await logPee(time)
      addToast(t('peeRecorded', { time }), 'pee')
    } catch (err) {
      console.error('Pee log failed:', err)
      addToast(t('error'), 'error')
    }
  }, [logPee, addToast, t])

  // Handle poop action
  const handlePoop = useCallback(async (time) => {
    try {
      await logPoop(time)
      addToast(t('poopRecorded', { time }), 'poop')
    } catch (err) {
      console.error('Poop log failed:', err)
      addToast(t('error'), 'error')
    }
  }, [logPoop, addToast, t])

  // Show setup screen if not connected
  if (isSetup) {
    return (
      <>
        <SetupScreen onConnect={handleConnect} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // Show Auth screen if not logged in
  if (!session) {
    return (
      <>
        <AuthScreen 
          supabaseClient={supabaseClient} 
          onLogin={(sess) => setSession(sess)} 
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // Loading state
  if (isLoading && matrix.size === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="text-5xl animate-bounce">💩</div>
          <p className="text-slate-400 text-sm font-medium">Loading matrix...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-6 pb-4 min-h-dvh">
        <Header fullTime={fullTime} />
        
        {/* Tab Navigation */}
        <div className="flex justify-center px-4">
          <div className="flex p-1 bg-slate-800/50 rounded-xl border border-glass-border overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'general'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Genel Durum
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 Değerlendirme
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👤 Profilim
            </button>

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`whitespace-nowrap px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-accent-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-accent-400'
                }`}
              >
                👑 Yönetim
              </button>
            )}
            
            <button
              onClick={async () => {
                await supabaseClient.auth.signOut()
                setSession(null)
              }}
              className="whitespace-nowrap px-4 sm:px-6 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all ml-1"
            >
              Çıkış
            </button>
          </div>
        </div>

        {activeTab === 'general' ? (
          <>
            <StatsBar stats={stats} />
            <ActionPanel
              timeStr={timeStr}
              onPee={handlePee}
              onPoop={handlePoop}
            />
            <Heatmap
              matrix={matrix}
              currentTimeStr={timeStr}
            />
          </>
        ) : activeTab === 'evaluation' ? (
          <EvaluationPage supabaseClient={supabaseClient} session={session} />
        ) : activeTab === 'profile' ? (
          <ProfilePage supabaseClient={supabaseClient} session={session} userRole={userRole} />
        ) : activeTab === 'admin' && userRole === 'admin' ? (
          <AdminPanel supabaseClient={supabaseClient} />
        ) : null}
        
        <div className="mt-auto">
          <Footer />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default App
