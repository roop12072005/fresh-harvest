const BASE = import.meta.env.VITE_API_URL ?? ''

export async function api(path, { method = 'GET', body } = {}) {
  const isFormData = body instanceof FormData
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body && !isFormData ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed')
    error.status = response.status
    error.payload = payload
    throw error
  }
  return payload.data
}

export function getProductId(product) {
  return product?._id || product?.id
}
