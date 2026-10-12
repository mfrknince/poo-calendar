import { useState, useEffect } from 'react'
import { getConfig, saveConfig, resetConfig, testConnection } from '../lib/supabaseFactory'

function DbSettings() {
  const config = getConfig()
  const [url, setUrl] = useState(config.url)
  const [key, setKey] = useState(config.key)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await testConnection(url.trim(), key.trim())
      saveConfig(url.trim(), key.trim())
      window.location.reload()
    } catch (err) {
      alert('Hata: ' + err.message)
      setSaving(false)
    }
  }

  const handleReset = () => {
    resetConfig()
    window.location.reload()
  }

  return (
    <div className="glass-card p-6 w-full animate-fade-in-up">
      <h2 className="text-xl font-bold text-white mb-1">🗄️ Veritabanı Bağlantısı</h2>
      <p className="text-xs text-slate-400 mb-4">
        {config.isOverride ? 'Bu cihazda özel bağlantı kullanılıyor.' : 'Varsayılan (appsettings.json) bağlantı kullanılıyor.'}
      </p>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Supabase URL</label>
          <input
            type="url"
            required
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Anon Key</label>
          <input
            type="password"
            required
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
            value={key}
            onChange={e => setKey(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          {config.isOverride && config.hasDefault && (
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Varsayılana Dön
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-accent-500 hover:bg-accent-400 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Test ediliyor...' : 'Test Et ve Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function AdminPanel({ supabaseClient }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormUsername('')
    setFormPassword('')
    setFormRole('user')
    setIsAddingUser(false)
    setEditingUserId(null)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    const { data, error } = await supabaseClient.rpc('admin_create_user', {
      new_username: formUsername,
      new_password: formPassword,
      new_role: formRole
    })

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      resetForm()
      fetchUsers()
    }
    setFormLoading(false)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    const { data, error } = await supabaseClient.rpc('admin_update_user', {
      target_user_id: editingUserId,
      new_username: formUsername,
      new_password: formPassword,
      new_role: formRole
    })

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      resetForm()
      fetchUsers()
    }
    setFormLoading(false)
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bu kullanıcıyı tamamen silmek istediğinize emin misiniz?')) return
    
    const { error } = await supabaseClient.rpc('admin_delete_user', {
      target_user_id: id
    })

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const startEdit = (user) => {
    setEditingUserId(user.id)
    setFormUsername(user.username)
    setFormPassword('') // Don't fetch password
    setFormRole(user.role)
    setIsAddingUser(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Kullanıcılar yükleniyor...</div>
  }

  return (
    <div className="w-full px-4 sm:px-6 flex-1 flex flex-col gap-6">
      
      {/* Add / Edit Form Modal-like UI */}
      {(isAddingUser || editingUserId) && (
        <div className="glass-card p-6 animate-fade-in-up border-accent-500/30 shadow-lg shadow-accent-500/10">
          <h3 className="text-lg font-bold text-white mb-4">
            {isAddingUser ? '✨ Yeni Kullanıcı Ekle' : '✏️ Kullanıcıyı Düzenle'}
          </h3>
          <form onSubmit={isAddingUser ? handleCreateUser : handleUpdateUser} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white"
                value={formUsername}
                onChange={e => setFormUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                Şifre {editingUserId && <span className="text-slate-500 lowercase">(Değiştirmek istemiyorsanız boş bırakın)</span>}
              </label>
              <input
                type="password"
                required={isAddingUser}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                Rol
              </label>
              <select
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white"
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
              >
                <option value="user">User (Standart)</option>
                <option value="admin">Admin (Yönetici)</option>
              </select>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 bg-accent-500 hover:bg-accent-400 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="glass-card p-6 w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">👑 Tüm Kullanıcılar</h2>
          {!isAddingUser && !editingUserId && (
            <button
              onClick={() => setIsAddingUser(true)}
              className="bg-accent-500 hover:bg-accent-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent-500/20"
            >
              + Yeni Kullanıcı
            </button>
          )}
        </div>
        
        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı Adı</th>
                <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kayıt Tarihi</th>
                <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3 text-sm text-slate-200 font-medium">{user.username}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      user.role === 'admin' ? 'bg-accent-500/20 text-accent-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-3 text-sm text-right space-x-2">
                    <button 
                      onClick={() => startEdit(user)}
                      className="text-accent-400 hover:text-accent-300 px-3 py-1 rounded-md hover:bg-accent-500/10 transition-colors"
                    >
                      Düzenle
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 px-3 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500">Hiç kullanıcı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DbSettings />
    </div>
  )
}
