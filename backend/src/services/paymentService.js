import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { env } from '../config/env.js'
import { Payment } from '../models/Payment.js'
import { Order } from '../models/Order.js'
import { ApiError } from '../utils/apiResponse.js'

const require = createRequire(import.meta.url)
const Razorpay = require('razorpay')

function getClient() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    return null
  }
  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  })
}

export function isRazorpayConfigured() {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret)
}

export async function createProviderOrder(order) {
  const client = getClient()
  if (!client) {
    return null
  }

  const amount = Math.round(order.pricing.total * 100)
  if (amount < 100) {
    throw new ApiError(400, 'Payment amount must be at least INR 1')
  }

  const razorpayOrder = await client.orders.create({
    amount,
    currency: order.pricing.currency || 'INR',
    receipt: order.orderNumber,
    notes: { orderId: String(order._id) },
  })

  await Payment.create({
    orderId: order._id,
    userId: order.userId,
    provider: 'razorpay',
    method: order.payment.method,
    amount: order.pricing.total,
    currency: order.pricing.currency,
    status: 'created',
    providerOrderId: razorpayOrder.id,
  })

  order.payment.providerOrderId = razorpayOrder.id
  await order.save()

  return {
    keyId: env.razorpay.keyId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  }
}

export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!env.razorpay.keySecret) {
    throw new ApiError(503, 'Payment gateway is not configured')
  }
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'utf8')
  const signatureBuffer = Buffer.from(String(signature || ''), 'utf8')
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new ApiError(400, 'Invalid payment signature')
  }
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = env.razorpay.webhookSecret || env.razorpay.keySecret
  if (!secret) {
    throw new ApiError(503, 'Payment webhook is not configured')
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected !== signature) {
    throw new ApiError(400, 'Invalid webhook signature')
  }
}

export async function markOrderPaid({ providerOrderId, providerPaymentId }) {
  const order = await Order.findOne({ 'payment.providerOrderId': providerOrderId })
  if (!order) {
    throw new ApiError(404, 'Order not found for payment')
  }

  if (order.payment.status === 'paid') {
    return order
  }

  order.payment.status = 'paid'
  order.payment.providerPaymentId = providerPaymentId
  if (order.status === 'placed') {
    order.status = 'confirmed'
    order.statusHistory.push({ status: 'confirmed', note: 'Payment confirmed' })
  }
  await order.save()

  await Payment.findOneAndUpdate(
    { providerOrderId },
    { status: 'paid', providerPaymentId },
    { new: true }
  )

  return order
}
