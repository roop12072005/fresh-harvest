export const FREE_DELIVERY_THRESHOLD = 500
export const DELIVERY_FEE = 40
export const CURRENCY = 'INR'

export function getSalePrice(product) {
  const discount = Number(product.discountPercent || 0)
  const price = Number(product.price || 0)
  if (!discount) return Math.round(price)
  return Math.round(price * (1 - discount / 100))
}

export function getDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const deliveryFee = getDeliveryFee(subtotal)
  const discount = items.reduce((sum, item) => {
    const full = item.listPrice * item.quantity
    return sum + Math.max(full - item.lineTotal, 0)
  }, 0)

  return {
    subtotal,
    deliveryFee,
    discount,
    total: subtotal + deliveryFee,
    currency: CURRENCY,
  }
}
