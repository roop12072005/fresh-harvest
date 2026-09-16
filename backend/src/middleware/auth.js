import { User } from '../models/User.js'
import { ApiError } from '../utils/apiResponse.js'
import { readAuthToken, verifyToken } from '../utils/tokens.js'

export async function requireAuth(req, res, next) {
  try {
    const token = readAuthToken(req, 'customer')
    if (!token) {
      throw new ApiError(401, 'Authentication required')
    }

    let payload
    try {
      payload = verifyToken(token)
    } catch {
      throw new ApiError(401, 'Invalid or expired token')
    }

    if (payload.type !== 'customer') {
      throw new ApiError(401, 'Invalid or expired token')
    }

    const user = await User.findById(payload.sub)
    if (!user) {
      throw new ApiError(401, 'Invalid or expired token')
    }
    if (!user.active) {
      throw new ApiError(403, 'Account is inactive')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
