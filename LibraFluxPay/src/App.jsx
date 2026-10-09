import { useEffect, useState } from 'react'
import { api } from './api'
import { Brand, Icon } from './components'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ManagePage from './pages/ManagePage'
import './App.css'
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState(window.location.hash)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    api('/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false))
    const change = () => setRoute(window.location.hash)
    const expire = () => {
      setUser(null)
      window.location.hash = '/login'
    }
    window.addEventListener('hashchange', change)
    window.addEventListener('session-expired', expire)
    return () => {
      window.removeEventListener('hashchange', change)
      window.removeEventListener('session-expired', expire)
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])
  const manage = route === '#/manage'
  async function logout() {
    try {
      await api('/logout', { method: 'POST' })
      setUser(null)
      window.location.hash = '/login'
    } catch (e) {
      setNotice(e.message)
    }
  }
  if (loading)
    return (
      <div className="loading" role="status">
        Carregando Libra - FluxoPay…
      </div>
    )
  if (!user)
    return (
      <LoginPage
        onLogin={(u) => {
          setUser(u)
          window.location.hash = '/home'
        }}
      />
    )
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Navegação principal">
          <a className={!manage ? 'active' : ''} href="#/home">
            <Icon name={!manage ? 'home' : 'homeOff'} />
            Visão geral
          </a>
          <button
            onClick={() =>
              setNotice('Consulte as solicitações recentes na visão geral.')
            }
          >
            <Icon name="list" />
            Solicitações
          </button>
          <button
            onClick={() =>
              setNotice(
                'O cadastro de solicitações será disponibilizado no módulo de pagamentos.',
              )
            }
          >
            <Icon name="file" />
            Nova solicitação
          </button>
          <a className={manage ? 'active' : ''} href="#/manage">
            <Icon name={manage ? 'usersOn' : 'users'} />
            Usuários e grupos
          </a>
          <button
            onClick={() =>
              setNotice('O módulo de relatórios ainda não está disponível.')
            }
          >
            <Icon name="reports" />
            Relatórios
          </button>
        </nav>
        <div className="account">
          <Icon name="avatar" />
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.groupId === 'admin' ? 'Administradora' : 'Colaborador'}
            </small>
          </div>
          <button
            className="icon-button"
            aria-label="Sair da conta"
            onClick={logout}
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <main className="main-content">
        {manage ? (
          <ManagePage
            currentUser={user}
            onUserChange={setUser}
            notify={setNotice}
          />
        ) : (
          <HomePage notify={setNotice} />
        )}
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Dispensar mensagem" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}
