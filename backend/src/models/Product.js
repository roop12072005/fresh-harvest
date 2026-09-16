import mongoose from 'mongoose'
import { slugify } from './Category.js'

const ratingSummarySchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    legacyId: { type: Number, unique: true, sparse: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    unit: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    organic: { type: Boolean, default: false, index: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    origin: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    ratingSummary: { type: ratingSummarySchema, default: () => ({ average: 0, count: 0 }) },
  },
  { timestamps: true }
)

productSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name)
  }
  next()
})

productSchema.index({ categoryId: 1, active: 1 })
productSchema.index({ price: 1 })
productSchema.index({ featured: 1, active: 1 })
productSchema.index({ name: 'text', description: 'text' })

productSchema.virtual('salePrice').get(function salePrice() {
  if (!this.discountPercent) return this.price
  return Math.round(this.price * (1 - this.discountPercent / 100))
})

export const Product = mongoose.model('Product', productSchema)
