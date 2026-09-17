import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiResponse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productDir = path.resolve(__dirname, '../../uploads/products')
const reviewDir = path.resolve(__dirname, '../../uploads/reviews')
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024

export async function saveProductImage(file) {
  if (!file) {
    throw new ApiError(400, 'Image file is required')
  }
  if (!ALLOWED.has(file.mimetype)) {
    throw new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed')
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, 'Image must be 5MB or smaller')
  }

  await fs.mkdir(productDir, { recursive: true })
  const filename = `${crypto.randomUUID()}.webp`
  const filepath = path.join(productDir, filename)

  await sharp(file.buffer)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath)

  return `/uploads/products/${filename}`
}

export async function deleteProductImage(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return
  }

  if (!imageUrl.startsWith('/uploads/products/')) {
    return
  }

  const filename = path.basename(imageUrl)
  const filepath = path.join(productDir, filename)
  await fs.unlink(filepath).catch(() => {})
}

export async function saveReviewImage(file) {
  if (!file) return ''
  if (!ALLOWED.has(file.mimetype)) {
    throw new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed')
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, 'Image must be 5MB or smaller')
  }
  await fs.mkdir(reviewDir, { recursive: true })
  const filename = `${crypto.randomUUID()}.webp`
  const filepath = path.join(reviewDir, filename)
  await sharp(file.buffer)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath)
  return `/uploads/reviews/${filename}`
}

export function toAbsoluteImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl
  if (imageUrl.startsWith('http')) return imageUrl
  return `${env.publicBaseUrl}${imageUrl}`
}
