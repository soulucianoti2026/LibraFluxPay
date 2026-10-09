export async function api(path, options = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.')
  }
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(
      'Servidor indisponível. Verifique se a API está em execução.',
    )
  }
  if (!response.ok) {
    if (response.status === 401 && path !== '/login' && path !== '/me')
      window.dispatchEvent(new Event('session-expired'))
    throw new Error(data.error)
  }
  return data
}
