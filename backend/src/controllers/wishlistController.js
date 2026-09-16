import { Wishlist } from '../models/Wishlist.js'
import { Product } from '../models/Product.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { toProductDto } from '../utils/serializers.js'

export async function getWishlist(req, res, next) {
  try {
    const rows = await Wishlist.find({ userId: req.user._id }).populate({
      path: 'productId',
      populate: { path: 'categoryId' },
    })
    const products = rows
      .map((row) => row.productId)
      .filter((product) => product && product.active)
      .map(toProductDto)
    return success(res, products)
  } catch (error) {
    next(error)
  }
}

export async function addWishlistItem(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product || !product.active) {
      throw new ApiError(404, 'Product not found')
    }
    try {
      await Wishlist.create({ userId: req.user._id, productId: product._id })
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Product already in wishlist')
      }
      throw error
    }
    return created(res, toProductDto(await product.populate('categoryId')))
  } catch (error) {
    next(error)
  }
}

export async function removeWishlistItem(req, res, next) {
  try {
    const deleted = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId: req.params.productId,
    })
    if (!deleted) {
      throw new ApiError(404, 'Wishlist item not found')
    }
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}
