import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiResponse.js'

export async function decrementStock(productId, quantity, session) {
  const updated = await Product.findOneAndUpdate(
    {
      _id: productId,
      active: true,
      stockQuantity: { $gte: quantity },
    },
    { $inc: { stockQuantity: -quantity } },
    { new: true, session }
  )

  if (!updated) {
    throw new ApiError(409, 'Insufficient stock for one or more products')
  }

  return updated
}

export async function incrementStock(productId, quantity, session) {
  return Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { stockQuantity: quantity } },
    { new: true, session }
  )
}
