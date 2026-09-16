import { Order } from '../models/Order.js'
import { success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import {
  createProviderOrder,
  markOrderPaid,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  isRazorpayConfigured,
} from '../services/paymentService.js'
import { toOrderDto } from './orderController.js'

export async function createPaymentOrder(req, res, next) {
  try {
    if (!isRazorpayConfigured()) {
      throw new ApiError(503, 'Payment gateway is not configured')
    }
    const order = await Order.findOne({
      _id: req.body.orderId,
      userId: req.user._id,
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.payment.method === 'cod') {
      throw new ApiError(400, 'Cash on delivery orders do not require online payment')
    }
    if (order.payment.status === 'paid') {
      throw new ApiError(409, 'Order is already paid')
    }
    const razorpay = await createProviderOrder(order)
    return success(res, { order: toOrderDto(order), razorpay })
  } catch (error) {
    next(error)
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, 'Razorpay payment verification fields are required')
    }
    const order = await Order.findOne({
      'payment.providerOrderId': razorpay_order_id,
      userId: req.user._id,
    })
    if (!order) {
      throw new ApiError(404, 'Order not found for payment')
    }
    verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })
    const paidOrder = await markOrderPaid({
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
    })
    return success(res, toOrderDto(paidOrder))
  } catch (error) {
    next(error)
  }
}

export async function paymentWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature']
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}))
    verifyWebhookSignature(rawBody, signature)
    const event = JSON.parse(rawBody.toString('utf8'))
    if (event.event === 'payment.captured') {
      const entity = event.payload?.payment?.entity
      if (entity?.order_id && entity?.id) {
        await markOrderPaid({
          providerOrderId: entity.order_id,
          providerPaymentId: entity.id,
        })
      }
    }
    return success(res, { received: true })
  } catch (error) {
    next(error)
  }
}
