import bcrypt from 'bcrypt'
import { body } from 'express-validator'
import { User } from '../models/User.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/tokens.js'

const SALT_ROUNDS = 12

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]

export const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    addresses: user.addresses,
    createdAt: user.createdAt,
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body
    const existing = await User.findOne({ $or: [{ email }, { phone }] })
    if (existing) {
      throw new ApiError(409, existing.email === email ? 'Email already registered' : 'Phone already registered')
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ name, email, phone, passwordHash })
    const token = signToken({ sub: String(user._id), type: 'customer' })
    setAuthCookie(res, token, 'customer')
    return created(res, toPublicUser(user))
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user) {
      throw new ApiError(401, 'Invalid email or password')
    }
    if (!user.active) {
      throw new ApiError(403, 'Account is inactive')
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      throw new ApiError(401, 'Invalid email or password')
    }

    const token = signToken({ sub: String(user._id), type: 'customer' })
    setAuthCookie(res, token, 'customer')
    return success(res, toPublicUser(user))
  } catch (error) {
    next(error)
  }
}

export async function logout(req, res, next) {
  try {
    clearAuthCookie(res, 'customer')
    return success(res, { loggedOut: true })
  } catch (error) {
    next(error)
  }
}

export async function me(req, res, next) {
  try {
    return success(res, toPublicUser(req.user))
  } catch (error) {
    next(error)
  }
}

export { toPublicUser }
