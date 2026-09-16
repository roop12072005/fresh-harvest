import jwt from 'jsonwebtoken'
import { env, isProduction } from '../config/env.js'

const CUSTOMER_COOKIE = 'fc_token'
const ADMIN_COOKIE = 'fc_admin_token'

function maxAgeMs() {
  const value = env.jwtExpiresIn
  if (typeof value === 'number') return value * 1000
  const match = String(value).match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const amount = Number(match[1])
  const unit = match[2]
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
  return amount * multipliers[unit]
}

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs(),
    path: '/',
  }
}

export function setAuthCookie(res, token, type = 'customer') {
  const name = type === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE
  res.cookie(name, token, cookieOptions())
}

export function clearAuthCookie(res, type = 'customer') {
  const name = type === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE
  res.clearCookie(name, { ...cookieOptions(), maxAge: 0 })
}

export function readAuthToken(req, type = 'customer') {
  const name = type === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE
  if (req.cookies?.[name]) return req.cookies[name]
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return null
}

export { CUSTOMER_COOKIE, ADMIN_COOKIE }
