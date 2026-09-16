export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function generateOrderId() {
  return `FH${Date.now().toString(36).toUpperCase()}`
}

export const FREE_DELIVERY_THRESHOLD = 500
export const DELIVERY_FEE = 40

export function getDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export function getAmountForFreeDelivery(subtotal) {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  return FREE_DELIVERY_THRESHOLD - subtotal
}
