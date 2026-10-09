import { test, expect } from '@playwright/test'
const credentials = {
  email: 'mariana.costa@aurorasaude.com.br',
  password: 'LibraFlux@2026',
}
async function login(page) {
  await page.goto('/')
  await page.getByLabel('E-mail corporativo').fill(credentials.email)
  await page.getByLabel('Senha *', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Visão geral', exact: true }),
  ).toBeVisible()
}
async function assets(page) {
  const images = await page
    .locator('img')
    .evaluateAll((elements) =>
      elements.map((img) => ({
        src: img.getAttribute('src'),
        loaded: img.complete && img.naturalWidth > 0,
        width: img.getBoundingClientRect().width,
        naturalWidth: img.naturalWidth,
        height: img.getBoundingClientRect().height,
        naturalHeight: img.naturalHeight,
      })),
    )
  for (const img of images) {
    expect(img.loaded, img.src).toBeTruthy()
    expect(img.width).toBe(img.naturalWidth)
    expect(img.height).toBe(img.naturalHeight)
  }
}
test('login, sessão, designs desktop e mobile', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail corporativo').fill(credentials.email)
  await page.getByLabel('Senha *', { exact: true }).fill('senha-incorreta')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('inválidos')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Acesse sua conta' }),
  ).toBeVisible()
  await assets(page)
  await page.screenshot({
    path: 'test-results/login-desktop.png',
    fullPage: true,
  })
  await login(page)
  await expect(page.getByText('Clínica Horizonte Ltda.')).toBeVisible()
  await assets(page)
  await page.screenshot({
    path: 'test-results/home-desktop.png',
    fullPage: true,
  })
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Visão geral', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Usuários e grupos' }).click()
  await expect(
    page.getByRole('cell', { name: credentials.email }),
  ).toBeVisible()
  await assets(page)
  await page.screenshot({
    path: 'test-results/manage-desktop.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'test-results/manage-mobile.png',
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(
    page.getByRole('heading', { name: 'Acesse sua conta' }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/login-mobile.png',
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy()
})
test('CRUD de usuários e grupos com filtros, persistência e exclusão protegida', async ({
  page,
}) => {
  await login(page)
  await page.getByRole('link', { name: 'Usuários e grupos' }).click()
  await page.getByRole('button', { name: /^Grupos/ }).click()
  await page.getByRole('button', { name: 'Adicionar grupo' }).click()
  await page.getByLabel('Nome *').fill('Equipe de testes')
  await page.getByLabel('Descrição').fill('Grupo temporário')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Equipe de testes' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Usuários/ }).click()
  await page.getByRole('button', { name: 'Adicionar usuário' }).click()
  await page.getByLabel('Nome *').fill('Pessoa Teste')
  await page.getByLabel('E-mail *', { exact: true }).fill('teste@example.com')
  await page
    .getByRole('combobox', { name: 'Grupo *', exact: true })
    .selectOption({ label: 'Equipe de testes' })
  await page.getByLabel('Senha *', { exact: true }).fill('TesteSenha123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByLabel('Buscar').fill('Pessoa Teste')
  await expect(
    page.getByRole('cell', { name: 'teste@example.com' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Editar Pessoa Teste', exact: true })
    .click()
  await page.getByLabel('Nome *').fill('Pessoa Atualizada')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByLabel('Buscar').fill('Atualizada')
  await expect(
    page.getByRole('cell', { name: 'Pessoa Atualizada', exact: true }),
  ).toBeVisible()
  await page.reload()
  await page.getByLabel('Buscar').fill('Atualizada')
  await expect(
    page.getByRole('cell', { name: 'Pessoa Atualizada', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Grupos/ }).click()
  const card = page
    .locator('.group-card')
    .filter({ hasText: 'Equipe de testes' })
  await card.getByRole('button', { name: 'Excluir grupo', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(page.getByRole('alert')).toContainText('Transfira')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page
    .getByRole('button', { name: 'Editar grupo Equipe de testes' })
    .click()
  await page.getByLabel('Nome *').fill('Equipe atualizada')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Equipe atualizada' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Usuários/ }).click()
  await page.getByRole('button', { name: 'Excluir Pessoa Atualizada' }).click()
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByText('Nenhum usuário encontrado.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Grupos/ }).click()
  await page
    .locator('.group-card')
    .filter({ hasText: 'Equipe atualizada' })
    .getByRole('button', { name: 'Excluir grupo', exact: true })
    .click()
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(
    page.getByRole('heading', { name: 'Equipe atualizada' }),
  ).not.toBeVisible()
})
test('API valida autenticação, permissões, duplicidade e autoproteção', async ({
  request,
}) => {
  expect((await request.get('/api/users')).status()).toBe(401)
  expect(
    (await request.post('/api/login', { data: credentials })).ok(),
  ).toBeTruthy()
  const users = await (await request.get('/api/users')).json()
  expect(users.every((u) => !('password' in u))).toBeTruthy()
  expect(
    (
      await request.post('/api/users', {
        data: { ...users[0], password: 'TesteSenha123!' },
      })
    ).status(),
  ).toBe(409)
  expect((await request.delete('/api/users/mariana')).status()).toBe(400)
  expect(
    (
      await request.put('/api/users/mariana', {
        data: { ...users[0], status: 'Inativo' },
      })
    ).status(),
  ).toBe(400)
  expect((await request.post('/api/logout')).ok()).toBeTruthy()
  expect((await request.get('/api/users')).status()).toBe(401)
  expect(
    (
      await request.post('/api/login', {
        data: {
          email: 'joao.henrique@aurorasaude.com.br',
          password: credentials.password,
        },
      })
    ).status(),
  ).toBe(401)
  await request.post('/api/login', {
    data: {
      email: 'camila.freitas@aurorasaude.com.br',
      password: credentials.password,
    },
  })
  expect((await request.get('/api/users')).status()).toBe(403)
  expect((await request.get('/api/overview')).status()).toBe(200)
})
