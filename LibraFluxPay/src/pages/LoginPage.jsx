/* eslint-disable react/prop-types */
import { useState } from 'react'
import { api } from '../api'
import { Brand, Icon, Modal } from '../components'
export default function LoginPage({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      onLogin(
        await api('/login', {
          method: 'POST',
          body: JSON.stringify({
            email: form.get('email'),
            password: form.get('password'),
            remember: form.has('remember'),
          }),
        }),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login-page">
      <section className="intro">
        <Brand login />
        <div className="intro-message">
          <h1>Pagamentos aprovados com clareza e controle.</h1>
          <p>
            Centralize solicitações, alçadas e documentos em um fluxo seguro,
            rastreável e simples para toda a empresa.
          </p>
          <ul>
            {[
              'Trilha de auditoria completa',
              'Alçadas automáticas por valor',
              'Notificações para cada responsável',
            ].map((text) => (
              <li key={text}>
                <Icon name="check" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <small>Ambiente corporativo protegido • LGPD</small>
      </section>
      <section className="login-access">
        <form className="login-form" onSubmit={submit}>
          <header>
            <h2>Acesse sua conta</h2>
            <p>Entre com seu e-mail corporativo para continuar.</p>
          </header>
          <label>
            E-mail corporativo *
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="mariana.costa@aurorasaude.com.br"
            />
          </label>
          <label>
            Senha *
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              placeholder="••••••••••"
            />
          </label>
          <div className="preferences">
            <label className="checkbox">
              <input name="remember" type="checkbox" defaultChecked />
              Manter conectado
            </label>
            <button
              type="button"
              className="link"
              onClick={() =>
                setInfo(
                  'Para recuperar seu acesso, solicite a redefinição de senha ao administrador pelo e-mail suporte@aurorasaude.com.br.',
                )
              }
            >
              Esqueci minha senha
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="divider">ou</div>
          <button
            className="secondary"
            type="button"
            onClick={() =>
              setInfo(
                'O acesso Microsoft ainda não está configurado. Entre com seu e-mail e senha ou contate o administrador da empresa.',
              )
            }
          >
            <Icon name="microsoft" />
            Entrar com Microsoft
          </button>
          <p className="support">
            Problemas para acessar? Fale com{' '}
            <a href="mailto:suporte@aurorasaude.com.br">
              suporte@aurorasaude.com.br
            </a>
          </p>
        </form>
      </section>
      {info && (
        <Modal title="Acesso à conta" close={() => setInfo('')}>
          <p>{info}</p>
          <div className="dialog-actions">
            <button className="primary" onClick={() => setInfo('')}>
              Entendi
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
