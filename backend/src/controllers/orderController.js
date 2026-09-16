import mongoose from 'mongoose'
import { success } from '../utils/apiResponse.js'
import { previewOrder, createOrder, cancelOrder } from '../services/orderService.js'
import { Order } from '../models/Order.js'
import { ApiError } from '../utils/apiResponse.js'

const STATUS_LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function toOrderDto(order) {
  const obj = order.toObject ? order.toObject() : order
  const shippingAddress = obj.shippingAddress || {}
  const deliverySlot = obj.deliverySlot || {}
  const pricing = obj.pricing || {}
  const payment = obj.payment || {}
  const latestCancellation = [...(obj.statusHistory || [])]
    .reverse()
    .find((item) => item.status === 'cancelled' || item.status === 'refunded')
  return {
    id: obj.orderNumber,
    _id: obj._id,
    orderNumber: obj.orderNumber,
    date: obj.createdAt,
    createdAt: obj.createdAt,
    items: (obj.items || []).map((item) => ({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      price: item.unitPrice,
      unitPrice: item.unitPrice,
      unit: item.unit,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: pricing.subtotal || 0,
    deliveryFee: pricing.deliveryFee || 0,
    discount: pricing.discount || 0,
    total: pricing.total || 0,
    currency: pricing.currency || 'INR',
    pricing,
    address: {
      fullName: shippingAddress.fullName || '',
      phone: shippingAddress.phone || '',
      address: shippingAddress.addressLine1 || '',
      addressLine1: shippingAddress.addressLine1 || '',
      addressLine2: shippingAddress.addressLine2 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      postalCode: shippingAddress.postalCode || '',
      country: shippingAddress.country || 'India',
      landmark: shippingAddress.landmark || '',
    },
    shippingAddress,
    deliverySlot: deliverySlot.label || '',
    deliverySlotDetails: deliverySlot,
    paymentMethod: payment.method || '',
    payment,
    status: STATUS_LABELS[obj.status] || obj.status,
    statusKey: obj.status,
    statusHistory: obj.statusHistory,
    cancellationReason: latestCancellation?.note || '',
  }
}

export async function preview(req, res, next) {
  try {
    const data = await previewOrder(req.body)
    return success(res, data)
  } catch (error) {
    next(error)
  }
}

export async function create(req, res, next) {
  try {
    const items = req.body.items
    const { order, razorpay } = await createOrder({
      userId: req.user._id,
      items,
      shippingAddress: req.body.shippingAddress || req.body.address,
      paymentMethod: req.body.paymentMethod,
      deliverySlotId: req.body.deliverySlotId,
      deliverySlot: req.body.deliverySlot,
    })
    return res.status(201).json({
      success: true,
      data: {
        order: toOrderDto(order),
        razorpay,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function listMine(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 })
    return success(res, orders.map(toOrderDto))
  } catch (error) {
    next(error)
  }
}

export async function getMine(req, res, next) {
  try {
    const order = await findOwnOrder(req)
    return success(res, toOrderDto(order))
  } catch (error) {
    next(error)
  }
}

export async function cancelMine(req, res, next) {
  try {
    const order = await findOwnOrder(req)
    const cancelled = await cancelOrder(order)
    return success(res, toOrderDto(cancelled))
  } catch (error) {
    next(error)
  }
}

async function findOwnOrder(req) {
  const { orderId } = req.params
  let order = await Order.findOne({ userId: req.user._id, orderNumber: orderId })
  if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findOne({ userId: req.user._id, _id: orderId })
  }
  if (!order) {
    throw new ApiError(404, 'Order not found')
  }
  return order
}
