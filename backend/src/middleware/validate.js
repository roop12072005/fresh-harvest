import { validationResult } from 'express-validator'
import { fail } from '../utils/apiResponse.js'

export function validate(req, res, next) {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }

  const fields = errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
  }))

  return fail(res, 'Validation failed', 400, { errors: fields })
}
