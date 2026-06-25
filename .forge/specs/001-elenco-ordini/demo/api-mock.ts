// ============================================================
// Mock API — Elenco Ordini Demo
// Simulates server-side pagination, search, filter, sort
// ============================================================

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface Order {
  id: number
  cliente: string
  email: string
  stato: OrderStatus
  totale: number
  data: string
  articoli: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OrderFilters {
  search: string
  status: string
  sort: string
  order: 'asc' | 'desc'
  page: number
  pageSize: number
}

const FIRST_NAMES = [
  'Mario', 'Anna', 'Luca', 'Sara', 'Giuseppe', 'Francesca', 'Antonio', 'Elena',
  'Giovanni', 'Chiara', 'Paolo', 'Martina', 'Marco', 'Laura', 'Andrea', 'Valentina',
  'Roberto', 'Simona', 'Fabio', 'Alessia', 'Stefano', 'Barbara', 'Claudio', 'Giulia',
  'Massimo', 'Federica', 'Daniele', 'Patrizia', 'Enrico', 'Monica',
]

const LAST_NAMES = [
  'Rossi', 'Bianchi', 'Verdi', 'Neri', 'Ferrari', 'Russo', 'Romano', 'Gallo',
  'Costa', 'Fontana', 'Conti', 'Moretti', 'Marini', 'Giordano', 'Rizzo', 'Lombardi',
  'Barbieri', 'Caruso', 'Sala', 'Longo', 'Fabbri', 'Fiori', 'De Luca', 'Marchetti',
  'Cattaneo', 'Grassi', 'Sartori', 'Guerra', 'Testa', 'Pellegrini',
]

const COMPANIES = [
  null, null, null, null, null, null, null,
  'SRL', 'SPA', 'SNC', 'SAS', 'Di', null, null,
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startDays: number, endDays: number): string {
  const now = Date.now()
  const offset = randomInt(startDays * 86400000, endDays * 86400000)
  const d = new Date(now - offset)
  d.setHours(randomInt(8, 18), randomInt(0, 59), randomInt(0, 59))
  return d.toISOString()
}

const STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled']

function generateOrders(count: number): Order[] {
  const orders: Order[] = []
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const company = randomItem(COMPANIES)
    const cliente = company
      ? `${firstName} ${lastName} — ${company}`
      : `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`

    orders.push({
      id: 10000 + i + 1,
      cliente,
      email,
      stato: randomItem(STATUSES),
      totale: parseFloat((Math.random() * 9500 + 50).toFixed(2)),
      data: randomDate(0, 180),
      articoli: randomInt(1, 15),
    })
  }
  return orders
}

const ALL_ORDERS = generateOrders(52)
const deletedOrders: Order[] = []

function delay(): Promise<void> {
  const ms = randomInt(200, 800)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getOrders(
  filters: OrderFilters,
): Promise<PaginatedResponse<Order>> {
  await delay()

  let filtered = [...ALL_ORDERS]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (o) =>
        o.cliente.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        String(o.id).includes(q),
    )
  }

  if (filters.status !== 'all') {
    filtered = filtered.filter((o) => o.stato === filters.status)
  }

  const { sort, order } = filters
  filtered.sort((a, b) => {
    let cmp = 0
    switch (sort) {
      case 'cliente':
        cmp = a.cliente.localeCompare(b.cliente)
        break
      case 'stato':
        cmp = a.stato.localeCompare(b.stato)
        break
      case 'totale':
        cmp = a.totale - b.totale
        break
      case 'data':
        cmp = new Date(a.data).getTime() - new Date(b.data).getTime()
        break
      default:
        cmp = 0
    }
    return order === 'asc' ? cmp : -cmp
  })

  const total = filtered.length
  const pageSize = filters.pageSize
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  if (Math.random() < 0.1) {
    throw new Error('Server connection error. Please try again later.')
  }

  return { items, total, page, pageSize, totalPages }
}

export async function deleteOrders(ids: number[]): Promise<void> {
  await delay()

  if (Math.random() < 0.1) {
    throw new Error('Errore di eliminazione: connessione al server fallita.')
  }

  for (const id of ids) {
    const idx = ALL_ORDERS.findIndex((o) => o.id === id)
    if (idx !== -1) {
      deletedOrders.push(ALL_ORDERS[idx])
      ALL_ORDERS.splice(idx, 1)
    }
  }
}

export async function undoDeleteOrders(ids: number[]): Promise<void> {
  await delay()
  for (const id of ids) {
    const idx = deletedOrders.findIndex((o) => o.id === id)
    if (idx !== -1) {
      ALL_ORDERS.push(deletedOrders[idx])
      deletedOrders.splice(idx, 1)
    }
  }
  ALL_ORDERS.sort((a, b) => a.id - b.id)
}
