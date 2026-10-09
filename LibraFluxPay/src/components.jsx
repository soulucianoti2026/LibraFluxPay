/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react'
const icons = {
  check: '2b9cf',
  microsoft: 'abaec',
  home: '2b681',
  homeOff: 'fc4dd',
  list: 'a5266',
  file: '4069c',
  users: '2ba7a',
  usersOn: '04531',
  reports: '6b339',
  avatar: '94e3d',
  logout: '08d7e',
  plus: '3ddba',
  edit: 'd5ad2',
  menu: 'd0701',
  editGroup: 'd5933',
}
export function Icon({ name }) {
  return <img className="icon" src={`/assets/${icons[name]}.svg`} alt="" />
}
export function Brand({ login = false }) {
  return (
    <div className={`brand ${login ? 'large' : ''}`}>
      <span className="brand-mark" />
      <div>
        <strong>Libra - FluxoPay</strong>
        {!login && <small>Gestão financeira</small>}
      </div>
    </div>
  )
}
export function Modal({ title, children, close }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current.showModal()
    return () => previous?.focus()
  }, [])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target === ref.current) close()
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar"
          onClick={close}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function Badge({ status }) {
  return (
    <span
      className={`badge ${['Ativo', 'Aprovada'].includes(status) ? 'green' : status === 'Recusada' ? 'red' : status === 'Inativo' ? 'gray' : 'amber'}`}
    >
      {status}
    </span>
  )
}
