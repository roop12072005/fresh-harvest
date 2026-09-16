import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import { formatPrice, formatDate } from '../utils/formatters'

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/alerts', label: 'Alerts' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
]

const blankProduct = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  discountPercent: '0',
  unit: 'kg',
  imageUrl: '',
  stockQuantity: '0',
  lowStockThreshold: '10',
  origin: '',
  organic: false,
  featured: false,
  active: true,
}

const blankCategory = {
  name: '',
  slug: '',
  imageUrl: '',
  description: '',
  displayOrder: '0',
  active: true,
}

function AdminShell({ admin, onLogout }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:block">
        <div className="border-b border-neutral-200 px-6 py-5">
          <p className="text-lg font-bold text-neutral-900">FreshCart Admin</p>
          <p className="mt-1 text-sm text-neutral-500">{admin.email}</p>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const active = item.to === '/admin' ? location.pathname === item.to : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-lg px-4 py-2 text-sm font-medium ${active ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-sm text-neutral-500">Admin Console</p>
              <h1 className="text-xl font-bold text-neutral-900">Manage store data</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50">
                Storefront
              </Link>
              <Button variant="secondary" size="sm" onClick={onLogout}>Logout</Button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="inventory" element={<InventoryAdmin />} />
            <Route path="alerts" element={<AlertsAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="users/:customerId" element={<CustomerDetailsAdmin />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: 'admin@freshharvest.in', password: 'Admin@12345' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const admin = await api('/api/admin/login', { method: 'POST', body: form })
      onLogin(admin)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-neutral-900">Admin Login</h1>
        <p className="mt-2 text-sm text-neutral-500">Use your admin account to manage FreshCart data.</p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="mt-6 block text-sm font-medium">
          Email
          <input className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input type="password" className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <Button type="submit" className="mt-6 w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api('/api/admin/me')
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false))
  }, [])

  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {})
    setAdmin(null)
    navigate('/admin')
  }

  if (checking) return <div className="p-8 text-neutral-500">Loading admin...</div>
  if (!admin) return <AdminLogin onLogin={setAdmin} />
  return <AdminShell admin={admin} onLogout={logout} />
}

function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/api/admin/dashboard').then(setData).catch(() => setData(null))
  }, [])

  if (!data) return <Loading />

  return (
    <section>
      <SectionTitle title="Dashboard" subtitle="Live store totals from the shared FreshCart database." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Orders" value={data.totalOrders} />
        <Metric label="Revenue" value={formatPrice(data.totalRevenue)} />
        <Metric label="Users" value={data.totalCustomers} />
        <Metric label="Products" value={data.totalProducts} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Low Stock">
          <SimpleList items={data.lowStockProducts || []} empty="No low-stock products." render={(item) => `${item.name} - ${item.stockQuantity} left`} />
        </Panel>
        <Panel title="Recent Orders">
          <SimpleList items={data.recentOrders || []} empty="No orders yet." render={(item) => `${item.orderNumber} - ${item.status} - ${formatPrice(item.total)}`} />
        </Panel>
      </div>
    </section>
  )
}

function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankProduct)
  const [message, setMessage] = useState('')

  const load = () => {
    Promise.all([api('/api/admin/products'), api('/api/admin/categories')]).then(([productList, categoryList]) => {
      setProducts(productList)
      setCategories(categoryList)
      setForm((prev) => (prev.categoryId || !categoryList[0] ? prev : { ...prev, categoryId: categoryList[0]._id }))
    })
  }

  useEffect(() => {
    load()
  }, [])

  function edit(product) {
    setEditing(product)
    setForm({
      name: product.name || '',
      categoryId: product.categoryId || '',
      description: product.description || '',
      price: String(product.price || ''),
      discountPercent: String(product.discountPercent || 0),
      unit: product.unit || 'kg',
      imageUrl: product.imageUrl || '',
      stockQuantity: String(product.stockQuantity || 0),
      lowStockThreshold: String(product.lowStockThreshold || 10),
      origin: product.origin || '',
      organic: Boolean(product.organic),
      featured: Boolean(product.featured),
      active: product.active !== false,
    })
  }

  async function save(event) {
    event.preventDefault()
    const method = editing ? 'PATCH' : 'POST'
    const path = editing ? `/api/admin/products/${editing._id}` : '/api/admin/products'
    await api(path, { method, body: form })
    setMessage(editing ? 'Product updated.' : 'Product created.')
    setEditing(null)
    setForm({ ...blankProduct, categoryId: categories[0]?._id || '' })
    load()
  }

  return (
    <section>
      <SectionTitle title="Products" subtitle="Add products into categories, update pricing, visibility, and stock settings." />
      {message && <Notice>{message}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title={editing ? 'Update Product' : 'Add Product'}>
          <form onSubmit={save} className="space-y-3">
            <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <SelectInput label="Category" value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} options={categories.map((item) => ({ value: item._id, label: item.name }))} />
            <TextInput label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} required />
            <TextInput label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Price" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
              <TextInput label="Discount %" type="number" value={form.discountPercent} onChange={(value) => setForm({ ...form, discountPercent: value })} />
              <TextInput label="Stock" type="number" value={form.stockQuantity} onChange={(value) => setForm({ ...form, stockQuantity: value })} />
              <TextInput label="Low stock at" type="number" value={form.lowStockThreshold} onChange={(value) => setForm({ ...form, lowStockThreshold: value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Unit" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
              <TextInput label="Origin" value={form.origin} onChange={(value) => setForm({ ...form, origin: value })} />
            </div>
            <Toggle label="Organic" checked={form.organic} onChange={(checked) => setForm({ ...form, organic: checked })} />
            <Toggle label="Featured" checked={form.featured} onChange={(checked) => setForm({ ...form, featured: checked })} />
            <Toggle label="Active on storefront" checked={form.active} onChange={(checked) => setForm({ ...form, active: checked })} />
            <div className="flex gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm({ ...blankProduct, categoryId: categories[0]?._id || '' }) }}>Cancel</Button>}
            </div>
          </form>
        </Panel>
        <Panel title="Current Products">
          <DataTable
            columns={['Product', 'Category', 'Price', 'Stock', 'Status', 'Action']}
            rows={products.map((product) => [
              product.name,
              product.categoryName || product.category,
              formatPrice(product.price),
              product.stockQuantity,
              product.active ? 'Active' : 'Hidden',
              <Button key={product._id} size="sm" variant="secondary" onClick={() => edit(product)}>Edit</Button>,
            ])}
          />
        </Panel>
      </div>
    </section>
  )
}

function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankCategory)

  const load = () => api('/api/admin/categories').then(setCategories)
  useEffect(() => {
    load()
  }, [])

  async function save(event) {
    event.preventDefault()
    const path = editing ? `/api/admin/categories/${editing._id}` : '/api/admin/categories'
    await api(path, { method: editing ? 'PATCH' : 'POST', body: form })
    setEditing(null)
    setForm(blankCategory)
    load()
  }

  function edit(category) {
    setEditing(category)
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      imageUrl: category.imageUrl || '',
      description: category.description || '',
      displayOrder: String(category.displayOrder || 0),
      active: category.active !== false,
    })
  }

  return (
    <section>
      <SectionTitle title="Categories" subtitle="Create and update the categories that products belong to." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title={editing ? 'Update Category' : 'Add Category'}>
          <form onSubmit={save} className="space-y-3">
            <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <TextInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
            <TextInput label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} required />
            <TextInput label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <TextInput label="Display order" type="number" value={form.displayOrder} onChange={(value) => setForm({ ...form, displayOrder: value })} />
            <Toggle label="Active" checked={form.active} onChange={(checked) => setForm({ ...form, active: checked })} />
            <div className="flex gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm(blankCategory) }}>Cancel</Button>}
            </div>
          </form>
        </Panel>
        <Panel title="Current Categories">
          <DataTable
            columns={['Category', 'Slug', 'Status', 'Action']}
            rows={categories.map((category) => [
              category.name,
              category.slug,
              category.active ? 'Active' : 'Hidden',
              <Button key={category._id} size="sm" variant="secondary" onClick={() => edit(category)}>Edit</Button>,
            ])}
          />
        </Panel>
      </div>
    </section>
  )
}

function InventoryAdmin() {
  const [items, setItems] = useState([])
  const [drafts, setDrafts] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('stock-low')
  const load = () => api('/api/admin/inventory').then(setItems)

  useEffect(() => {
    load()
  }, [])

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...items]
      .filter((item) => {
        const status = inventoryStatus(item)
        const matchesSearch = !query || item.name.toLowerCase().includes(query)
        const matchesStatus = statusFilter === 'all' || status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'stock-high') return b.stockQuantity - a.stockQuantity
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'low-threshold') return b.lowStockThreshold - a.lowStockThreshold
        return a.stockQuantity - b.stockQuantity
      })
  }, [items, search, statusFilter, sortBy])

  async function update(productId) {
    const draft = drafts[productId] || items.find((item) => item._id === productId)
    await api(`/api/admin/inventory/${productId}`, {
      method: 'PATCH',
      body: {
        stockQuantity: Number(draft.stockQuantity),
        lowStockThreshold: Number(draft.lowStockThreshold),
      },
    })
    load()
  }

  return (
    <section>
      <SectionTitle title="Inventory" subtitle="Update current stock and see which products are in stock or out of stock." />
      <Panel title="Stock Control">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All stock</option>
            <option value="in-stock">In stock</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="stock-low">Stock: low first</option>
            <option value="stock-high">Stock: high first</option>
            <option value="name">Name A-Z</option>
            <option value="low-threshold">Threshold high first</option>
          </select>
        </div>
        <DataTable
          columns={['Product', 'Current status', 'Stock', 'Low stock at', 'Action']}
          rows={visibleItems.map((item) => {
            const draft = drafts[item._id] || item
            const status = inventoryStatusLabel(item)
            return [
              item.name,
              status,
              <input key="stock" type="number" className="w-24 rounded-lg border border-neutral-200 px-2 py-1" value={draft.stockQuantity} onChange={(event) => setDrafts({ ...drafts, [item._id]: { ...draft, stockQuantity: event.target.value } })} />,
              <input key="threshold" type="number" className="w-24 rounded-lg border border-neutral-200 px-2 py-1" value={draft.lowStockThreshold} onChange={(event) => setDrafts({ ...drafts, [item._id]: { ...draft, lowStockThreshold: event.target.value } })} />,
              <Button key="save" size="sm" onClick={() => update(item._id)}>Save</Button>,
            ]
          })}
        />
      </Panel>
    </section>
  )
}

function inventoryStatus(item) {
  if (item.stockQuantity <= 0) return 'out-of-stock'
  if (item.stockQuantity <= item.lowStockThreshold) return 'low-stock'
  return 'in-stock'
}

function inventoryStatusLabel(item) {
  const status = inventoryStatus(item)
  if (status === 'out-of-stock') return 'Out of stock'
  if (status === 'low-stock') return 'Low stock'
  return 'In stock'
}

function AlertsAdmin() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api('/api/admin/inventory').then((list) => {
      setItems(list.filter((item) => item.stockQuantity <= item.lowStockThreshold))
    })
  }, [])

  return (
    <section>
      <SectionTitle title="Stock Alerts" subtitle="Products that are nearly sold out or completely out of stock." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className={`rounded-lg border p-5 ${item.stockQuantity <= 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className="font-semibold text-neutral-900">{item.name}</p>
            <p className="mt-2 text-sm text-neutral-700">
              {item.stockQuantity <= 0 ? 'Completely out of stock.' : `${item.stockQuantity} unit${item.stockQuantity === 1 ? '' : 's'} left.`}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Alert threshold: {item.lowStockThreshold}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-neutral-500">No stock alerts right now.</p>}
      </div>
    </section>
  )
}

function OrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [cancelTarget, setCancelTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => api('/api/admin/orders').then(setOrders)
  useEffect(() => {
    load()
  }, [])

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...orders]
      .filter((order) => {
        const pending = ['placed', 'confirmed', 'packing', 'out_for_delivery'].includes(order.statusKey)
        const matchesSearch =
          !query ||
          order.orderNumber?.toLowerCase().includes(query) ||
          order.address?.fullName?.toLowerCase().includes(query) ||
          order.address?.phone?.toLowerCase().includes(query)
        const matchesStatus =
          statusFilter === 'all' ||
          order.statusKey === statusFilter ||
          (statusFilter === 'pending' && pending)
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
        if (sortBy === 'total-high') return b.total - a.total
        if (sortBy === 'total-low') return a.total - b.total
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [orders, search, statusFilter, sortBy])

  async function updateStatus(order, status) {
    setMessage('')
    setError('')
    try {
      await api(`/api/admin/orders/${order.orderNumber}/status`, {
        method: 'PATCH',
        body: { status, note: `Status changed to ${status.replaceAll('_', ' ')}` },
      })
      setMessage(`${order.orderNumber} updated to ${status.replaceAll('_', ' ')}.`)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function cancelOrder(event) {
    event.preventDefault()
    await api('/api/admin/cancel-order', {
      method: 'POST',
      body: { orderNumber: cancelTarget.orderNumber, reason, restock },
    })
    setCancelTarget(null)
    setReason('')
    setRestock(true)
    load()
  }

  return (
    <section>
      <SectionTitle title="Orders" subtitle="Update fulfillment status or cancel orders with a customer-visible reason." />
      {message && <Notice>{message}</Notice>}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Panel title="Recent Orders">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px_170px]">
          <input
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Search order, customer, phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending / active</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="packing">Packing</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total-high">Total high first</option>
            <option value="total-low">Total low first</option>
          </select>
        </div>
        <DataTable
          columns={['Order', 'Date', 'Customer', 'Total', 'Status', 'Next action']}
          rows={visibleOrders.map((order) => [
            order.orderNumber,
            formatDate(order.createdAt),
            order.address?.fullName || 'Customer',
            formatPrice(order.total),
            <div key={`${order.orderNumber}-status`}>
              <p>{order.status}</p>
              {order.statusHistory?.length > 0 && (
                <p className="mt-1 text-xs text-neutral-400">
                  Updated {formatDate(order.statusHistory[order.statusHistory.length - 1].at)}
                </p>
              )}
            </div>,
            <div key={order.orderNumber} className="flex flex-wrap gap-2">
              <StatusButton order={order} onUpdate={updateStatus} />
              {['placed', 'confirmed', 'packing'].includes(order.statusKey) && (
                <Button size="sm" variant="danger" onClick={() => setCancelTarget(order)}>Cancel</Button>
              )}
            </div>,
          ])}
        />
      </Panel>
      {cancelTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={cancelOrder} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Cancel {cancelTarget.orderNumber}</h2>
            <p className="mt-2 text-sm text-neutral-500">This reason will be shown to the customer on their order details page.</p>
            <label className="mt-4 block text-sm font-medium">
              Reason
              <textarea className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} required />
            </label>
            <Toggle label="Restock cancelled quantity" checked={restock} onChange={setRestock} />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>Close</Button>
              <Button type="submit" variant="danger">Cancel order</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function UsersAdmin() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const load = () => api('/api/admin/customers').then(setUsers)

  useEffect(() => {
    load()
  }, [])

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...users]
      .filter((user) =>
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sortBy === 'orders') return (b.orderCount || 0) - (a.orderCount || 0)
        if (sortBy === 'spent') return (b.totalSpent || 0) - (a.totalSpent || 0)
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [users, search, sortBy])

  async function setActive(user, active) {
    await api(`/api/admin/customers/${user._id}/status`, { method: 'PATCH', body: { active } })
    load()
  }

  return (
    <section>
      <SectionTitle title="Users" subtitle={`${users.length} registered customer${users.length === 1 ? '' : 's'} on the website.`} />
      <Panel title="Registered Users">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px]">
          <input
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Search name, email, phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest registered</option>
            <option value="oldest">Oldest registered</option>
            <option value="orders">Most orders</option>
            <option value="spent">Highest spend</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <DataTable
          columns={['Name', 'Email', 'Phone', 'Orders', 'Spent', 'Status', 'Action']}
          rows={visibleUsers.map((user) => [
            <Link key={`${user._id}-name`} to={`/admin/users/${user._id}`} className="font-medium text-primary-700 hover:text-primary-800">{user.name}</Link>,
            user.email,
            user.phone,
            user.orderCount || 0,
            formatPrice(user.totalSpent || 0),
            user.active ? 'Active' : 'Inactive',
            <div key={user._id} className="flex flex-wrap gap-2">
              <Link to={`/admin/users/${user._id}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50">Details</Link>
              <Button size="sm" variant="secondary" onClick={() => setActive(user, !user.active)}>
                {user.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>,
          ])}
        />
      </Panel>
    </section>
  )
}

function CustomerDetailsAdmin() {
  const { customerId } = useParams()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/admin/customers/${customerId}`)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }, [customerId])

  if (error) {
    return (
      <section>
        <SectionTitle title="Customer Details" subtitle={error} />
        <Link to="/admin/users" className="text-sm font-medium text-primary-700">Back to users</Link>
      </section>
    )
  }

  if (!detail) return <Loading />

  const { customer, stats, recentOrders, cart, activity } = detail

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle title={customer.name} subtitle={`${customer.email} - ${customer.phone}`} />
        <Link to="/admin/users" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50">Back to users</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Orders" value={stats.orderCount} />
        <Metric label="Total spent" value={formatPrice(stats.totalSpent)} />
        <Metric label="Active orders" value={stats.activeOrderCount} />
        <Metric label="Cart items" value={stats.cartItemCount} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Recent Orders">
          <DataTable
            columns={['Order', 'Date', 'Total', 'Status']}
            rows={(recentOrders || []).map((order) => [
              order.orderNumber,
              formatDate(order.createdAt),
              formatPrice(order.total),
              order.status,
            ])}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="Profile">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-neutral-500">Registered</dt><dd className="font-medium">{formatDate(customer.createdAt)}</dd></div>
              <div><dt className="text-neutral-500">Status</dt><dd className="font-medium">{customer.active ? 'Active' : 'Inactive'}</dd></div>
              <div><dt className="text-neutral-500">Wishlist items</dt><dd className="font-medium">{stats.wishlistCount}</dd></div>
              <div><dt className="text-neutral-500">Delivered orders</dt><dd className="font-medium">{stats.deliveredOrderCount}</dd></div>
              <div><dt className="text-neutral-500">Cancelled/refunded</dt><dd className="font-medium">{stats.cancelledOrderCount}</dd></div>
            </dl>
          </Panel>
          <Panel title="Current Cart">
            <SimpleList
              items={cart?.items || []}
              empty="Cart is empty."
              render={(item) => `${item.name} x ${item.quantity}`}
            />
          </Panel>
          <Panel title="Activity">
            <SimpleList
              items={activity || []}
              empty="No activity yet."
              render={(item) => `${formatDate(item.at)} - ${item.label}`}
            />
          </Panel>
        </div>
      </div>
    </section>
  )
}

function StatusButton({ order, onUpdate }) {
  const nextStatus = {
    placed: 'confirmed',
    confirmed: 'packing',
    packing: 'out_for_delivery',
    out_for_delivery: 'delivered',
  }[order.statusKey]

  if (!nextStatus) return <span className="text-sm text-neutral-400">No action</span>
  return <Button size="sm" variant="secondary" onClick={() => onUpdate(order, nextStatus)}>Mark {nextStatus.replaceAll('_', ' ')}</Button>
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-neutral-900">{title}</h3>
      {children}
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold text-neutral-500">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 text-neutral-700">{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-neutral-500" colSpan={columns.length}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SimpleList({ items, empty, render }) {
  if (!items.length) return <p className="text-sm text-neutral-500">{empty}</p>
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, index) => (
        <li key={item._id || item.orderNumber || index} className="rounded-lg bg-neutral-50 px-3 py-2">{render(item)}</li>
      ))}
    </ul>
  )
}

function TextInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2" />
    </label>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
      {label}
    </label>
  )
}

function Notice({ children }) {
  return <p className="mb-4 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">{children}</p>
}

function Loading() {
  return <p className="text-neutral-500">Loading...</p>
}

export function AdminRedirect() {
  return <Navigate to="/admin" replace />
}
