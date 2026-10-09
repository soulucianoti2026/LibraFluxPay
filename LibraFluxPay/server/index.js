import http from 'node:http'
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  randomUUID,
} from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { groups, users, requests } from './seed.js'

const file =
  process.env.DATA_FILE ||
  fileURLToPath(new URL('./data/db.json', import.meta.url))
const hash = (password) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
const verify = (password, stored) => {
  const [salt, digest] = stored.split(':')
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(digest, 'hex'),
  )
}
mkdirSync(dirname(resolve(file)), { recursive: true })
let db = existsSync(file)
  ? JSON.parse(readFileSync(file, 'utf8'))
  : {
      groups,
      users: users.map((u) => ({
        ...u,
        password: hash(process.env.SEED_PASSWORD || 'LibraFlux@2026'),
      })),
      requests,
    }
const persist = (next) => {
  writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2))
  renameSync(`${file}.tmp`, file)
  db = next
}
if (!existsSync(file)) persist(db)
const sessions = new Map()
const attempts = new Map()
const safeUser = ({ password: _password, ...user }) => user
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status })
}
const clean = (value) => (typeof value === 'string' ? value.trim() : '')
const body = async (req) => {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 32768) fail('Requisição muito grande.', 413)
  }
  try {
    return JSON.parse(raw || '{}')
  } catch {
    fail('JSON inválido.')
  }
}
const server = http.createServer(async (req, res) => {
  const send = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    res.end(JSON.stringify(data))
  }
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    if (
      !['GET', 'HEAD'].includes(req.method) &&
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    )
      fail('Origem não permitida.', 403)
    const token = req.headers.cookie
      ?.split('; ')
      .find((c) => c.startsWith('fluxpay='))
      ?.slice(8)
    const session = sessions.get(token)
    const user =
      session &&
      session.expires > Date.now() &&
      db.users.find((u) => u.id === session.userId && u.status === 'Ativo')
    const cookie = (value) =>
      res.setHeader(
        'Set-Cookie',
        value +
          '; HttpOnly; SameSite=Strict; Path=/' +
          (process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''),
      )
    if (path === '/api/login' && req.method === 'POST') {
      const data = await body(req)
      const key = req.socket.remoteAddress
      const attempt = attempts.get(key) || {
        count: 0,
        until: Date.now() + 900000,
      }
      if (attempt.until < Date.now()) {
        attempt.count = 0
        attempt.until = Date.now() + 900000
      }
      if (attempt.count >= 10)
        fail('Muitas tentativas. Tente novamente em 15 minutos.', 429)
      const account = db.users.find(
        (u) =>
          u.email === clean(data.email).toLowerCase() && u.status === 'Ativo',
      )
      if (
        !account ||
        typeof data.password !== 'string' ||
        !verify(data.password, account.password)
      ) {
        attempt.count++
        attempts.set(key, attempt)
        fail('E-mail ou senha inválidos.', 401)
      }
      attempts.delete(key)
      if (token) sessions.delete(token)
      const id = randomBytes(32).toString('hex')
      const seconds = data.remember ? 604800 : 28800
      sessions.set(id, {
        userId: account.id,
        expires: Date.now() + seconds * 1000,
      })
      cookie(`fluxpay=${id}${data.remember ? `; Max-Age=${seconds}` : ''}`)
      return send(200, safeUser(account))
    }
    if (path === '/api/logout' && req.method === 'POST') {
      sessions.delete(token)
      cookie('fluxpay=; Max-Age=0')
      return send(200, { ok: true })
    }
    if (!user) fail('Sua sessão expirou. Entre novamente.', 401)
    if (path === '/api/me' && req.method === 'GET')
      return send(200, safeUser(user))
    if (path === '/api/overview' && req.method === 'GET')
      return send(200, {
        requests: db.requests,
        metrics: [12, 48, 5, 7],
        volumes: [74, 126, 48, 88, 156, 116],
      })
    if (!db.groups.find((g) => g.id === user.groupId)?.admin)
      fail('Acesso restrito a administradores.', 403)
    const match = path.match(/^\/api\/(users|groups)(?:\/([^/]+))?$/)
    if (!match) fail('Recurso não encontrado.', 404)
    const [, kind, id] = match
    if (req.method === 'GET')
      return send(200, kind === 'users' ? db.users.map(safeUser) : db.groups)
    const data = ['POST', 'PUT'].includes(req.method) ? await body(req) : null
    const next = structuredClone(db)
    const existing = next[kind].find((x) => x.id === id)
    if (id && !existing) fail('Registro não encontrado.', 404)
    if (req.method === 'DELETE' && id) {
      if (kind === 'users' && id === user.id)
        fail('Você não pode excluir sua própria conta.')
      if (kind === 'groups' && next.users.some((u) => u.groupId === id))
        fail('Transfira os usuários deste grupo antes de excluí-lo.')
      next[kind] = next[kind].filter((x) => x.id !== id)
    } else if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
      const name = clean(data.name)
      if (name.length < 2 || name.length > 100)
        fail('Informe um nome entre 2 e 100 caracteres.')
      let record
      if (kind === 'users') {
        const email = clean(data.email).toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
          fail('Informe um e-mail válido.')
        if (next.users.some((u) => u.email === email && u.id !== id))
          fail('Este e-mail já está cadastrado.', 409)
        if (!next.groups.some((g) => g.id === data.groupId))
          fail('Selecione um grupo válido.')
        if (!['Ativo', 'Inativo'].includes(data.status))
          fail('Status inválido.')
        if (
          (!id || data.password) &&
          (typeof data.password !== 'string' ||
            data.password.length < 10 ||
            data.password.length > 128)
        )
          fail('A senha deve ter entre 10 e 128 caracteres.')
        if (
          id === user.id &&
          (data.status !== 'Ativo' ||
            !next.groups.find((g) => g.id === data.groupId)?.admin)
        )
          fail('Você não pode remover seu próprio acesso administrativo.')
        record = {
          id: id || randomUUID(),
          name,
          email,
          groupId: data.groupId,
          status: data.status,
          password: data.password ? hash(data.password) : existing.password,
        }
      } else {
        if (
          next.groups.some(
            (g) => g.name.toLowerCase() === name.toLowerCase() && g.id !== id,
          )
        )
          fail('Já existe um grupo com esse nome.', 409)
        if (!Number.isFinite(Number(data.limit)) || Number(data.limit) < 0)
          fail('Informe uma alçada válida.')
        if (id === user.groupId && !data.admin)
          fail('Você não pode remover sua própria permissão administrativa.')
        record = {
          id: id || randomUUID(),
          name,
          description: clean(data.description).slice(0, 300),
          limit: Number(data.limit),
          admin: data.admin === true,
        }
      }
      next[kind] = id
        ? next[kind].map((x) => (x.id === id ? record : x))
        : [...next[kind], record]
    } else fail('Método não permitido.', 405)
    persist(next)
    if (kind === 'users' && id)
      for (const [key, value] of sessions)
        if (value.userId === id && key !== token) sessions.delete(key)
    return send(200, { ok: true })
  } catch (error) {
    if (!error.status) console.error(error)
    send(error.status || 500, {
      error: error.status
        ? error.message
        : 'Não foi possível salvar. Tente novamente.',
    })
  }
})
server.listen(process.env.PORT || 3001, '127.0.0.1', () =>
  console.log(
    'API FluxoPay disponível em http://127.0.0.1:' + (process.env.PORT || 3001),
  ),
)
