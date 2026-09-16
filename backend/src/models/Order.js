import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: { type: String, default: '' },
  },
  { _id: false }
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    deliverySlot: {
      slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliverySlot' },
      date: { type: String, required: true },
      label: { type: String, required: true },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    payment: {
      method: { type: String, enum: ['upi', 'card', 'cod'], required: true },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'cod'],
        default: 'pending',
      },
      providerOrderId: { type: String, default: '' },
      providerPaymentId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'packing',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'placed',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
)

orderSchema.index({ userId: 1, createdAt: -1 })

export const Order = mongoose.model('Order', orderSchema)
