const BASE = process.env.API_URL || 'http://localhost:5000'

async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  const setCookie = response.headers.getSetCookie?.() || []
  return { status: response.status, body: data, cookie: setCookie.join('; ') }
}

function cookieOf(result) {
  return result.cookie || ''
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function run() {
  const stamp = Date.now()
  const email = `qa${stamp}@freshharvest.in`
  const phone = `98${String(stamp).slice(-8)}`

  const unauth = await request('/api/cart')
  assert(unauth.status === 401, `expected 401 cart, got ${unauth.status}`)

  const badRegister = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'A', email: 'bad', phone: '1', password: 'x' },
  })
  assert(badRegister.status === 400, 'expected 400 invalid register')

  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'QA User', email, phone, password: 'Password123' },
  })
  assert(registered.status === 201, `register failed ${registered.status} ${registered.body.message}`)
  let cookie = cookieOf(registered)

  const dup = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'QA User', email, phone, password: 'Password123' },
  })
  assert(dup.status === 409, 'expected 409 duplicate user')

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'Password123' },
  })
  assert(login.status === 200, 'login failed')
  cookie = cookieOf(login) || cookie

  const me = await request('/api/auth/me', { cookie })
  assert(me.status === 200 && me.body.data.email === email, 'me failed')

  const products = await request('/api/products?limit=5')
  const product = products.body.data.items[0]
  assert(product, 'need a product')

  const addCart = await request('/api/cart/items', {
    method: 'POST',
    cookie,
    body: { productId: product._id, quantity: 2 },
  })
  assert(addCart.status === 201, `add cart failed ${addCart.status} ${addCart.body.message}`)

  const overstock = await request('/api/cart/items', {
    method: 'POST',
    cookie,
    body: { productId: product._id, quantity: 99999 },
  })
  assert(overstock.status === 409, 'expected 409 overstock')

  const wishlist = await request(`/api/wishlist/${product._id}`, { method: 'POST', cookie })
  assert(wishlist.status === 201, 'wishlist add failed')
  const wishlistDup = await request(`/api/wishlist/${product._id}`, { method: 'POST', cookie })
  assert(wishlistDup.status === 409, 'expected 409 wishlist dup')

  const slots = await request('/api/delivery-slots')
  assert(slots.status === 200 && slots.body.data.length > 0, 'slots failed')
  const slot = slots.body.data[0]

  const preview = await request('/api/orders/preview', {
    method: 'POST',
    cookie,
    body: {
      items: [{ productId: product._id, quantity: 1 }],
      deliverySlotId: slot.id,
    },
  })
  assert(preview.status === 200 && preview.body.data.total > 0, `preview failed ${preview.status}`)

  const badProduct = await request('/api/orders/preview', {
    method: 'POST',
    cookie,
    body: { items: [{ productId: 'aaaaaaaaaaaaaaaaaaaaaaaa', quantity: 1 }], deliverySlotId: slot.id },
  })
  assert(badProduct.status === 404, 'invalid product preview should 404')

  const zeroQty = await request('/api/orders', {
    method: 'POST',
    cookie,
    body: {
      items: [{ productId: product._id, quantity: 0 }],
      paymentMethod: 'cod',
      deliverySlotId: slot.id,
      shippingAddress: {
        fullName: 'QA User',
        phone,
        addressLine1: '1 Test Street',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
      },
    },
  })
  assert(zeroQty.status === 400, 'zero quantity should 400')

  const created = await request('/api/orders', {
    method: 'POST',
    cookie,
    body: {
      items: [{ productId: product._id, quantity: 1 }],
      paymentMethod: 'cod',
      deliverySlotId: slot.id,
      shippingAddress: {
        fullName: 'QA User',
        phone,
        addressLine1: '1 Test Street',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
      },
    },
  })
  assert(created.status === 201, `create order failed ${created.status} ${created.body.message}`)
  const orderNumber = created.body.data.order.orderNumber

  const other = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Other User',
      email: `other${stamp}@freshharvest.in`,
      phone: `97${String(stamp).slice(-8)}`,
      password: 'Password123',
    },
  })
  const stolen = await request(`/api/orders/${orderNumber}`, { cookie: cookieOf(other) })
  assert(stolen.status === 404, 'should not read another user order')

  const mine = await request(`/api/orders/${orderNumber}`, { cookie })
  assert(mine.status === 200, 'own order should load')

  const adminLogin = await request('/api/admin/login', {
    method: 'POST',
    body: { email: 'admin@freshharvest.in', password: 'Admin@12345' },
  })
  assert(adminLogin.status === 200, `admin login failed ${adminLogin.status} ${adminLogin.body.message}`)
  const adminCookie = cookieOf(adminLogin)

  const dash = await request('/api/admin/dashboard', { cookie: adminCookie })
  assert(dash.status === 200 && dash.body.data.totalProducts >= 1, 'dashboard failed')

  const customerList = await request('/api/admin/customers', { cookie })
  assert(customerList.status === 401 || customerList.status === 403, 'customer token must not access admin')

  console.log('API suite passed')
}

run().catch((error) => {
  console.error('API suite failed:', error.message)
  process.exit(1)
})
