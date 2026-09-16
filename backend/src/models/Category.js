function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

categorySchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name)
  }
  next()
})

export const Category = mongoose.model('Category', categorySchema)
export { slugify }
