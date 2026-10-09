/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Badge, Icon, Modal } from '../components'
export default function ManagePage({ currentUser, onUserChange, notify }) {
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [group, setGroup] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  async function refresh() {
    const [u, g] = await Promise.all([api('/users'), api('/groups')])
    setUsers(u)
    setGroups(g)
    setLoading(false)
  }
  useEffect(() => {
    refresh().catch((e) => {
      setError(e.message)
      setLoading(false)
    })
  }, [])
  const groupName = (id) => groups.find((g) => g.id === id)?.name || ''
  const normalized = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const filtered = users.filter(
    (u) =>
      normalized(`${u.name} ${u.email} ${groupName(u.groupId)}`).includes(
        normalized(search),
      ) &&
      (!status || u.status === status) &&
      (!group || u.groupId === group),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / 4))
  const activePage = Math.min(page, pages)
  function open(kind, record = {}, remove = false) {
    setFormError('')
    setModal({ kind, record, remove })
  }
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    data.admin = data.admin === 'on'
    try {
      await api(
        `/${modal.kind}${modal.record.id ? '/' + modal.record.id : ''}`,
        {
          method: modal.remove ? 'DELETE' : modal.record.id ? 'PUT' : 'POST',
          body: modal.remove ? undefined : JSON.stringify(data),
        },
      )
      await refresh()
      if (modal.kind === 'users' && modal.record.id === currentUser.id)
        onUserChange(await api('/me'))
      setModal(null)
      notify(
        modal.remove
          ? 'Registro excluído com sucesso.'
          : 'Alterações salvas com sucesso.',
      )
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Usuários e grupos</h1>
          <p>
            Cadastre pessoas, atribua perfis e controle alçadas de aprovação.
          </p>
        </div>
        <button
          className="primary"
          disabled={loading || !!error}
          onClick={() => open(tab)}
        >
          <Icon name="plus" />
          Adicionar {tab === 'users' ? 'usuário' : 'grupo'}
        </button>
      </header>
      <div className="tabs" aria-label="Gerenciamento">
        {[
          ['users', 'Usuários', users.length],
          ['groups', 'Grupos', groups.length],
        ].map(([key, title, count]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            className={tab === key ? 'selected' : ''}
            onClick={() => setTab(key)}
          >
            {title} • {count}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando cadastros…</p>
      ) : (
        !error && (
          <>
            {tab === 'users' && (
              <section className="card manage-card">
                <div className="filters">
                  <label>
                    Buscar
                    <input
                      placeholder="Nome, e-mail ou grupo"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">Todos os status</option>
                      <option>Ativo</option>
                      <option>Inativo</option>
                    </select>
                  </label>
                  <label>
                    Grupo
                    <select
                      value={group}
                      onChange={(e) => {
                        setGroup(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="">Todos os grupos</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="table-scroll">
                  <table className="users-table">
                    <thead>
                      <tr>
                        {['Usuário', 'E-mail', 'Grupo', 'Status', 'Ações'].map(
                          (t) => (
                            <th key={t}>{t}</th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .slice((activePage - 1) * 4, activePage * 4)
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name}</strong>
                            </td>
                            <td>{u.email}</td>
                            <td>{groupName(u.groupId)}</td>
                            <td>
                              <Badge status={u.status} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`Editar ${u.name}`}
                                  onClick={() => open('users', u)}
                                >
                                  <Icon name="edit" />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Excluir ${u.name}`}
                                  onClick={() => open('users', u, true)}
                                  disabled={u.id === currentUser.id}
                                >
                                  <Icon name="menu" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {!filtered.length && (
                        <tr>
                          <td colSpan="5" className="empty">
                            Nenhum usuário encontrado. Altere os filtros ou
                            adicione um usuário.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <footer className="pagination">
                  <span>
                    Exibindo {filtered.length ? (activePage - 1) * 4 + 1 : 0}–
                    {Math.min(activePage * 4, filtered.length)} de{' '}
                    {filtered.length} usuários
                  </span>
                  <nav aria-label="Paginação">
                    <button
                      disabled={activePage === 1}
                      aria-label="Página anterior"
                      onClick={() => setPage(activePage - 1)}
                    >
                      ‹
                    </button>
                    {Array.from({ length: pages }, (_, i) => (
                      <button
                        key={i}
                        aria-label={`Página ${i + 1}`}
                        aria-current={activePage === i + 1 ? 'page' : undefined}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={activePage === pages}
                      aria-label="Próxima página"
                      onClick={() => setPage(activePage + 1)}
                    >
                      ›
                    </button>
                  </nav>
                </footer>
              </section>
            )}
            <div className="group-grid">
              {(tab === 'users' ? groups.slice(0, 3) : groups).map((g) => (
                <section className="card group-card" key={g.id}>
                  <div>
                    <h3>{g.name}</h3>
                    <button
                      className="icon-button"
                      aria-label={`Editar grupo ${g.name}`}
                      onClick={() => open('groups', g)}
                    >
                      <Icon name="editGroup" />
                    </button>
                  </div>
                  <strong>
                    {users.filter((u) => u.groupId === g.id).length} usuários
                  </strong>
                  <p>{g.description}</p>
                  {tab === 'groups' && (
                    <button
                      className="link danger"
                      onClick={() => open('groups', g, true)}
                    >
                      Excluir grupo
                    </button>
                  )}
                </section>
              ))}
            </div>
          </>
        )
      )}
      {modal && (
        <Modal
          title={`${modal.remove ? 'Excluir' : modal.record.id ? 'Editar' : 'Adicionar'} ${modal.kind === 'users' ? 'usuário' : 'grupo'}`}
          close={() => !busy && setModal(null)}
        >
          <form className="editor" onSubmit={save}>
            {modal.remove ? (
              <p>
                Deseja excluir <strong>{modal.record.name}</strong>? Esta ação
                não pode ser desfeita.
                {modal.kind === 'groups' &&
                  ' Grupos com usuários vinculados não podem ser excluídos.'}
              </p>
            ) : (
              <>
                <label>
                  Nome *
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={modal.record.name}
                  />
                </label>
                {modal.kind === 'users' ? (
                  <>
                    <label>
                      E-mail *
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={modal.record.email}
                      />
                    </label>
                    <label>
                      Grupo *
                      <select
                        name="groupId"
                        required
                        defaultValue={modal.record.groupId || ''}
                      >
                        <option value="" disabled>
                          Selecione um grupo
                        </option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Status
                      <select
                        name="status"
                        defaultValue={modal.record.status || 'Ativo'}
                      >
                        <option>Ativo</option>
                        <option>Inativo</option>
                      </select>
                    </label>
                    <label>
                      {modal.record.id ? 'Nova senha (opcional)' : 'Senha *'}
                      <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        required={!modal.record.id}
                        minLength={10}
                        maxLength={128}
                        placeholder="Mínimo de 10 caracteres"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Descrição
                      <textarea
                        name="description"
                        maxLength={300}
                        defaultValue={modal.record.description}
                      />
                    </label>
                    <label>
                      Alçada de aprovação (R$)
                      <input
                        name="limit"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={modal.record.limit || 0}
                      />
                    </label>
                    <label className="checkbox">
                      <input
                        name="admin"
                        type="checkbox"
                        defaultChecked={modal.record.admin}
                      />
                      Permitir gestão de usuários e grupos
                    </label>
                  </>
                )}
              </>
            )}
            {formError && (
              <p className="error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                className={modal.remove ? 'destructive' : 'primary'}
                disabled={busy}
              >
                {busy
                  ? 'Salvando…'
                  : modal.remove
                    ? 'Confirmar exclusão'
                    : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
