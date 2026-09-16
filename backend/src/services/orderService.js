import mongoose from 'mongoose'
import { Product } from '../models/Product.js'
import { DeliverySlot } from '../models/DeliverySlot.js'
import { Order } from '../models/Order.js'
import { Cart } from '../models/Cart.js'
import { ApiError } from '../utils/apiResponse.js'
import { generateOrderNumber } from '../utils/generateOrderNumber.js'
import { calculateTotals, getSalePrice } from './pricingService.js'
import { decrementStock, incrementStock } from './inventoryService.js'
import { createProviderOrder, isRazorpayConfigured } from './paymentService.js'

const CANCELABLE = new Set(['placed', 'confirmed'])

export const STATUS_FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

function normalizeAddress(input = {}) {
  const addressLine1 = input.addressLine1 || input.address || ''
  return {
    fullName: input.fullName,
    phone: input.phone,
    addressLine1,
    addressLine2: input.addressLine2 || '',
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country || 'India',
    landmark: input.landmark || '',
  }
}

function validateAddress(address) {
  const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode']
  for (const field of required) {
    if (!String(address[field] || '').trim()) {
      throw new ApiError(400, 'Validation failed', {
        errors: [{ field, message: `${field} is required` }],
      })
    }
  }
}

async function loadQuotedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'Order items are required')
  }

  const quoted = []
  for (const item of rawItems) {
    const productId = item.productId || item._id || item.id
    const quantity = Number(item.quantity)
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new ApiError(400, 'Invalid product ID')
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, 'Quantity must be a positive integer')
    }

    const product = await Product.findById(productId)
    if (!product) {
      throw new ApiError(404, 'Product not found')
    }
    if (!product.active) {
      throw new ApiError(409, `${product.name} is no longer available`)
    }
    if (product.stockQuantity < quantity) {
      throw new ApiError(409, `Insufficient stock for ${product.name}`)
    }

    const unitPrice = getSalePrice(product)
    quoted.push({
      product,
      productId: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      unit: product.unit,
      quantity,
      listPrice: product.price,
      unitPrice,
      lineTotal: unitPrice * quantity,
    })
  }
  return quoted
}

async function resolveSlot({ deliverySlotId, deliverySlot, date, label }) {
  const slotDate = deliverySlot?.date || date || new Date().toISOString().slice(0, 10)
  const slotLabel = deliverySlot?.label || label
  const slotId = deliverySlotId || deliverySlot?.slotId || deliverySlot?.id

  let slot
  if (slotId && mongoose.Types.ObjectId.isValid(slotId)) {
    slot = await DeliverySlot.findById(slotId)
  } else if (slotLabel) {
    slot = await DeliverySlot.findOne({ date: slotDate, label: slotLabel, active: true })
  }

  if (!slot || !slot.active) {
    throw new ApiError(400, 'Invalid delivery slot')
  }
  if (slot.bookedCount >= slot.capacity) {
    throw new ApiError(409, 'Selected delivery slot is full')
  }
  return slot
}

export async function previewOrder({ items, deliverySlotId, deliverySlot, date, label }) {
  const quoted = await loadQuotedItems(items)
  const slot = await resolveSlot({ deliverySlotId, deliverySlot, date, label })
  const pricing = calculateTotals(quoted)

  return {
    items: quoted.map((item) => ({
      productId: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    ...pricing,
    available: true,
    deliverySlot: {
      id: slot._id,
      date: slot.date,
      label: slot.label,
    },
  }
}

export async function createOrder({ userId, items, shippingAddress, paymentMethod, deliverySlotId, deliverySlot }) {
  const method = paymentMethod === 'credit/debit card' ? 'card' : paymentMethod
  if (!['upi', 'card', 'cod'].includes(method)) {
    throw new ApiError(400, 'Invalid payment method')
  }
  if (method !== 'cod' && !isRazorpayConfigured()) {
    throw new ApiError(503, 'Online payment is not configured. Please choose Cash on Delivery.')
  }

  const address = normalizeAddress(shippingAddress)
  validateAddress(address)

  const quoted = await loadQuotedItems(items)
  const slot = await resolveSlot({ deliverySlotId, deliverySlot })
  const pricing = calculateTotals(quoted)

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    items: quoted.map((item) => ({
      productId: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: address,
    deliverySlot: {
      slotId: slot._id,
      date: slot.date,
      label: slot.label,
    },
    pricing,
    payment: {
      method,
      status: method === 'cod' ? 'cod' : 'pending',
    },
    status: 'placed',
    statusHistory: [{ status: 'placed', note: 'Order placed' }],
  })

  const decremented = []
  try {
    for (const item of quoted) {
      await decrementStock(item.productId, item.quantity)
      decremented.push(item)
    }

    const booked = await DeliverySlot.findOneAndUpdate(
      { _id: slot._id, bookedCount: { $lt: slot.capacity }, active: true },
      { $inc: { bookedCount: 1 } },
      { new: true }
    )
    if (!booked) {
      throw new ApiError(409, 'Selected delivery slot is full')
    }

    let razorpay = null
    if (method !== 'cod') {
      razorpay = await createProviderOrder(order)
    }

    // Keep online-payment carts until payment verification succeeds. This lets
    // the customer retry after dismissing or failing the Razorpay modal.
    if (method === 'cod') {
      await Cart.findOneAndUpdate({ userId }, { items: [] })
    }

    return { order, razorpay }
  } catch (error) {
    await Order.deleteOne({ _id: order._id })
    for (const item of decremented) {
      await incrementStock(item.productId, item.quantity).catch(() => {})
    }
    throw error
  }
}

export async function cancelOrder(order) {
  if (!CANCELABLE.has(order.status)) {
    throw new ApiError(409, 'This order can no longer be cancelled')
  }

  order.status = 'cancelled'
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' })
  if (order.payment.status === 'paid') {
    order.payment.status = 'refunded'
    order.status = 'refunded'
    order.statusHistory.push({ status: 'refunded', note: 'Refund initiated' })
  }
  await order.save()

  for (const item of order.items) {
    await incrementStock(item.productId, item.quantity)
  }

  if (order.deliverySlot?.slotId) {
    await DeliverySlot.updateOne(
      { _id: order.deliverySlot.slotId, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } }
    )
  }

  return order
}

export function assertTransition(from, to) {
  const allowed = STATUS_FLOW[from] || []
  if (!allowed.includes(to)) {
    throw new ApiError(409, `Cannot change status from ${from} to ${to}`)
  }
}
