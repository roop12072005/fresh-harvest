import { isProduction } from '../config/env.js'
import { ApiError, fail } from '../utils/apiResponse.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof ApiError) {
    return fail(res, err.message, err.status, err.extra)
  }

  if (err.name === 'CastError') {
    return fail(res, 'Invalid identifier', 400)
  }

  if (err.name === 'ValidationError') {
    const fields = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }))
    return fail(res, 'Validation failed', 400, { errors: fields })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field'
    return fail(res, `${field} already exists`, 409)
  }

  const status = err.status || err.statusCode || 500
  const message =
    status === 500 && isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error'

  return fail(res, message, status)
}
