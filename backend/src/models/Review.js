import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    imageUrl: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 1000 },
    verifiedPurchase: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
)

reviewSchema.index({ orderId: 1, productId: 1, userId: 1 }, { unique: true })

export const Review = mongoose.model('Review', reviewSchema)
