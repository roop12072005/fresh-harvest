import crypto from 'node:crypto'

export function generateOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `FH-${stamp}-${rand}`
}
