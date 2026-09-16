import mongoose from 'mongoose'
import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { calculateTotals, getSalePrice } from '../services/pricingService.js'
import { toProductDto } from '../utils/serializers.js'

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId })
  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
  }
  return cart
}

async function hydrateCart(cart) {
  const productIds = cart.items.map((item) => item.productId)
  const products = await Product.find({ _id: { $in: productIds } }).populate('categoryId')
  const productMap = new Map(products.map((product) => [String(product._id), product]))

  const items = []
  for (const item of cart.items) {
    const product = productMap.get(String(item.productId))
    if (!product || !product.active) continue
    const unitPrice = getSalePrice(product)
    items.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      product: toProductDto(product),
    })
  }

  const pricing = calculateTotals(
    items.map((item) => ({
      lineTotal: item.lineTotal,
      listPrice: item.product.price,
      quantity: item.quantity,
    }))
  )

  return {
    items,
    ...pricing,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

async function assertPurchasable(productId, quantity) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID')
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0')
  }
  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  if (!product.active) {
    throw new ApiError(409, 'Product is not available')
  }
  if (quantity > product.stockQuantity) {
    throw new ApiError(409, 'Requested quantity exceeds available stock')
  }
  return product
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    return success(res, await hydrateCart(cart))
  } catch (error) {
    next(error)
  }
}

export async function addCartItem(req, res, next) {
  try {
    const productId = req.body.productId
    const quantity = Number(req.body.quantity || 1)
    await assertPurchasable(productId, quantity)

    const cart = await getOrCreateCart(req.user._id)
    const existing = cart.items.find((item) => String(item.productId) === String(productId))
    const nextQty = (existing?.quantity || 0) + quantity
    await assertPurchasable(productId, nextQty)

    if (existing) existing.quantity = nextQty
    else cart.items.push({ productId, quantity })

    await cart.save()
    return created(res, await hydrateCart(cart))
  } catch (error) {
    next(error)
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const quantity = Number(req.body.quantity)
    await assertPurchasable(req.params.productId, quantity)
    const cart = await getOrCreateCart(req.user._id)
    const existing = cart.items.find((item) => String(item.productId) === req.params.productId)
    if (!existing) {
      throw new ApiError(404, 'Item not found in cart')
    }
    existing.quantity = quantity
    await cart.save()
    return success(res, await hydrateCart(cart))
  } catch (error) {
    next(error)
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    cart.items = cart.items.filter((item) => String(item.productId) !== req.params.productId)
    await cart.save()
    return success(res, await hydrateCart(cart))
  } catch (error) {
    next(error)
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    cart.items = []
    await cart.save()
    return success(res, await hydrateCart(cart))
  } catch (error) {
    next(error)
  }
}
