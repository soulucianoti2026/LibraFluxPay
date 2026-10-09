export const groups = [
  {
    id: 'admin',
    name: 'Administradores',
    description: 'Acesso total e gestão de cadastros',
    admin: true,
    limit: 0,
  },
  {
    id: 'approver',
    name: 'Aprovadores N2',
    description: 'Aprovação acima de R$ 20.000',
    admin: false,
    limit: 20000,
  },
  {
    id: 'finance',
    name: 'Financeiro',
    description: 'Execução e baixa de pagamentos',
    admin: false,
    limit: 0,
  },
  {
    id: 'requester',
    name: 'Solicitantes',
    description: 'Cadastro e acompanhamento de solicitações',
    admin: false,
    limit: 0,
  },
]
export const users = [
  {
    id: 'mariana',
    name: 'Mariana Costa',
    email: 'mariana.costa@aurorasaude.com.br',
    groupId: 'admin',
    status: 'Ativo',
  },
  {
    id: 'ricardo',
    name: 'Ricardo Nunes',
    email: 'ricardo.nunes@aurorasaude.com.br',
    groupId: 'approver',
    status: 'Ativo',
  },
  {
    id: 'camila',
    name: 'Camila Freitas',
    email: 'camila.freitas@aurorasaude.com.br',
    groupId: 'finance',
    status: 'Ativo',
  },
  {
    id: 'joao',
    name: 'João Henrique',
    email: 'joao.henrique@aurorasaude.com.br',
    groupId: 'requester',
    status: 'Inativo',
  },
]
export const requests = [
  {
    id: 'OP-2026-0184',
    provider: 'Clínica Horizonte Ltda.',
    amount: 18450,
    due: '2026-09-25',
    status: 'Pendente',
  },
  {
    id: 'OP-2026-0183',
    provider: 'DataMed Sistemas S.A.',
    amount: 36780.9,
    due: '2026-09-27',
    status: '2ª aprovação',
  },
  {
    id: 'OP-2026-0182',
    provider: 'Elevadores Atlas Ltda.',
    amount: 4890,
    due: '2026-09-22',
    status: 'Aprovada',
  },
  {
    id: 'OP-2026-0181',
    provider: 'Studio Norte Arquitetura',
    amount: 12300,
    due: '2026-09-20',
    status: 'Recusada',
  },
]
