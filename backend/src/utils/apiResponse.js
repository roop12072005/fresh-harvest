export function success(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, data })
}

export function created(res, data = {}) {
  return success(res, data, 201)
}

export function fail(res, message, status = 400, extra = {}) {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  })
}

export class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}
