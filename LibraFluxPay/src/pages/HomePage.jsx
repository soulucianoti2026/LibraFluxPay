/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Badge, Icon } from '../components'
export default function HomePage({ notify }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api('/overview')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe o fluxo de pagamentos da Aurora Saúde.</p>
        </div>
        <button
          className="primary"
          onClick={() =>
            notify(
              'O cadastro de solicitações será disponibilizado no módulo de pagamentos.',
            )
          }
        >
          <Icon name="plus" />
          Nova solicitação
        </button>
      </header>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : !data ? (
        <p role="status">Carregando visão geral…</p>
      ) : (
        <>
          <div className="metrics">
            {['Pendentes', 'Aprovadas', 'Recusadas', 'Encerradas'].map(
              (title, i) => (
                <section className="card metric" key={title}>
                  <h3>{title}</h3>
                  <strong>{data.metrics[i]}</strong>
                  <p>
                    <span className={`dot dot-${i}`} />
                    {
                      [
                        'Aguardam sua atenção',
                        'Nos últimos 30 dias',
                        'Precisam de ajuste',
                        'Aprovação já anexada',
                      ][i]
                    }
                  </p>
                </section>
              ),
            )}
          </div>
          <div className="summary">
            <section className="card volume">
              <h2>Volume por status</h2>
              <div
                className="chart"
                role="img"
                aria-label="Volume mensal: abril 74, maio 126, junho 48, julho 88, agosto 156, setembro 116"
              >
                {data.volumes.map((height, i) => (
                  <div className="column" key={i}>
                    <div
                      className={i === 4 ? 'bar active' : 'bar'}
                      style={{ height }}
                    />
                    <span>{['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'][i]}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="card attention">
              <h2>Requer atenção</h2>
              <p>4 solicitações vencem nos próximos 3 dias</p>
              <p>2 aguardam segundo aprovador</p>
              <p>1 rascunho sem anexos</p>
            </section>
          </div>
          <section className="card">
            <h2>Solicitações recentes</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      'Ordem',
                      'Prestador',
                      'Valor bruto',
                      'Vencimento',
                      'Status',
                    ].map((t) => (
                      <th key={t}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.provider}</td>
                      <td>
                        {r.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td>{r.due.split('-').reverse().join('/')}</td>
                      <td>
                        <Badge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}
