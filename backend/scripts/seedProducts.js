import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { connectDatabase } from '../src/config/database.js'
import { Category, slugify } from '../src/models/Category.js'
import { Product } from '../src/models/Product.js'
import { Admin } from '../src/models/Admin.js'
import { DeliverySlot } from '../src/models/DeliverySlot.js'
import { categories as frontendCategories, products as frontendProducts } from '../../src/data/products.js'

const SLOT_LABELS = ['10 AM - 12 PM', '12 PM - 2 PM', '4 PM - 6 PM', '6 PM - 8 PM']

function dateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

async function seed() {
  await connectDatabase()
  console.log('Connected to MongoDB')

  const categoryIds = new Map()

  for (const [index, category] of frontendCategories.entries()) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        name: category.name,
        slug: category.slug,
        imageUrl: category.image,
        description: category.description,
        active: true,
        displayOrder: index + 1,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    categoryIds.set(category.slug, doc._id)
    console.log(`Category upserted: ${doc.slug}`)
  }

  let created = 0
  let updated = 0

  for (const product of frontendProducts) {
    const categoryId = categoryIds.get(product.category)
    if (!categoryId) {
      throw new Error(`Missing category for product ${product.name}: ${product.category}`)
    }

    const payload = {
      name: product.name,
      slug: slugify(product.name),
      legacyId: product.id,
      categoryId,
      description: product.description,
      price: product.price,
      discountPercent: product.discount || 0,
      unit: product.unit,
      imageUrl: product.image,
      organic: Boolean(product.organic),
      stockQuantity: product.stock,
      lowStockThreshold: 10,
      origin: product.origin,
      featured: Boolean(product.featured),
      active: true,
      ratingSummary: {
        average: product.rating,
        count: product.reviewCount,
      },
    }

    const existing = await Product.findOne({
      $or: [{ legacyId: product.id }, { slug: payload.slug }],
    })

    if (existing) {
      await Product.updateOne({ _id: existing._id }, payload)
      updated += 1
    } else {
      await Product.create(payload)
      created += 1
    }
  }

  const adminEmail = 'admin@freshharvest.in'
  const existingAdmin = await Admin.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await Admin.create({
      name: 'FreshHarvest Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash('Admin@12345', 12),
      role: 'admin',
      active: true,
    })
    console.log('Admin created: admin@freshharvest.in / Admin@12345')
  } else {
    console.log('Admin already exists')
  }

  for (let day = 0; day < 7; day += 1) {
    const date = dateOffset(day)
    for (const label of SLOT_LABELS) {
      await DeliverySlot.updateOne(
        { date, label },
        { $setOnInsert: { date, label, capacity: 50, bookedCount: 0, active: true } },
        { upsert: true }
      )
    }
  }
  console.log('Delivery slots upserted for the next 7 days')

  console.log(`Seed complete. Products created: ${created}, updated: ${updated}, total source products: ${frontendProducts.length}`)
  await mongoose.disconnect()
}

seed().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
