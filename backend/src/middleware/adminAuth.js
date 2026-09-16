import { Admin } from '../models/Admin.js'
import { ApiError } from '../utils/apiResponse.js'
import { readAuthToken, verifyToken } from '../utils/tokens.js'

export async function requireAdmin(req, res, next) {
  try {
    const token = readAuthToken(req, 'admin')
    if (!token) {
      throw new ApiError(401, 'Admin authentication required')
    }

    let payload
    try {
      payload = verifyToken(token)
    } catch {
      throw new ApiError(401, 'Invalid or expired token')
    }

    if (payload.type !== 'admin') {
      throw new ApiError(403, 'Admin access required')
    }

    const admin = await Admin.findById(payload.sub)
    if (!admin) {
      throw new ApiError(401, 'Invalid or expired token')
    }
    if (!admin.active) {
      throw new ApiError(403, 'Admin account is inactive')
    }

    req.admin = admin
    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(new ApiError(403, 'Insufficient admin permissions'))
    }
    next()
  }
}
