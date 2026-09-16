import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, default: 'razorpay' },
    method: { type: String, enum: ['upi', 'card', 'cod'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    providerOrderId: { type: String, default: '', index: true },
    providerPaymentId: { type: String, default: '' },
    signature: { type: String, default: '' },
  },
  { timestamps: true }
)

export const Payment = mongoose.model('Payment', paymentSchema)
