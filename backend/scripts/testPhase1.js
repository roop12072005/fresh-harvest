const BASE = process.env.API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options)
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function run() {
  const health = await request('/api/health')
  assert(health.status === 200 && health.body.success, 'health check failed')

  const missing = await request('/api/does-not-exist')
  assert(missing.status === 404 && missing.body.success === false, '404 handler failed')

  const invalid = await request('/api/products?page=0')
  assert(invalid.status === 400 && invalid.body.success === false, 'validation 400 failed')

  const products = await request('/api/products?limit=5')
  assert(products.status === 200, 'product list failed')
  assert(Array.isArray(products.body.data.items), 'product list missing items')
  assert(products.body.data.pagination.total >= 1, 'expected seeded products')

  const search = await request('/api/products?search=apple&category=fruits&organic=true&inStock=true&sort=price-low&page=1&limit=20')
  assert(search.status === 200, 'search failed')
  assert(search.body.data.items.every((item) => item.category === 'fruits'), 'category filter failed')

  const deals = await request('/api/products?deals=true')
  assert(deals.status === 200, 'deals filter failed')
  assert(deals.body.data.items.every((item) => item.discount > 0), 'deals should only return discounted products')

  const featured = await request('/api/products?featured=true')
  assert(featured.status === 200 && featured.body.data.items.length > 0, 'featured filter failed')

  const sample = products.body.data.items[0]
  const byId = await request(`/api/products/${sample._id}`)
  assert(byId.status === 200 && byId.body.data.name === sample.name, 'get product by id failed')

  const byLegacy = await request('/api/products/1')
  assert(byLegacy.status === 200 && byLegacy.body.data.name === 'Shimla Apple', 'legacy id lookup failed')

  const related = await request(`/api/products/${sample._id}/related`)
  assert(related.status === 200 && Array.isArray(related.body.data), 'related products failed')

  const notFoundProduct = await request('/api/products/aaaaaaaaaaaaaaaaaaaaaaaa')
  assert(notFoundProduct.status === 404, 'missing product should be 404')

  const categories = await request('/api/categories')
  assert(categories.status === 200 && categories.body.data.length >= 6, 'categories failed')

  console.log('Phase 1 API tests passed')
}

run().catch((error) => {
  console.error('Phase 1 API tests failed:', error.message)
  process.exit(1)
})
