import { Review } from '../models/Review.js'
import { Product } from '../models/Product.js'
import { Order } from '../models/Order.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'

async function refreshProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId, approved: true } },
    {
      $group: {
        _id: '$productId',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])
  const summary = stats[0]
    ? { average: Math.round(summarySafe(stats[0].average) * 10) / 10, count: stats[0].count }
    : { average: 0, count: 0 }
  await Product.findByIdAndUpdate(productId, { ratingSummary: summary })
}

function summarySafe(value) {
  return Number(value) || 0
}

export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      approved: true,
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })

    return success(
      res,
      reviews.map((review) => ({
        id: review._id,
        author: review.userId?.name || 'Customer',
        rating: review.rating,
        date: review.createdAt,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
      }))
    )
  } catch (error) {
    next(error)
  }
}

export async function createReview(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      throw new ApiError(404, 'Product not found')
    }

    const order = await Order.findOne({
      _id: req.body.orderId,
      userId: req.user._id,
      status: 'delivered',
      'items.productId': product._id,
    })
    if (!order) {
      throw new ApiError(403, 'You can only review products from delivered orders')
    }

    const rating = Number(req.body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5')
    }

    let review
    try {
      review = await Review.create({
        productId: product._id,
        userId: req.user._id,
        orderId: order._id,
        rating,
        comment: req.body.comment || '',
        verifiedPurchase: true,
        approved: true,
      })
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'You have already reviewed this product')
      }
      throw error
    }

    await refreshProductRating(product._id)
    return created(res, review)
  } catch (error) {
    next(error)
  }
}

export async function updateReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) {
      throw new ApiError(404, 'Review not found')
    }
    if (String(review.userId) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only edit your own reviews')
    }
    if (req.body.rating) review.rating = req.body.rating
    if (req.body.comment !== undefined) review.comment = req.body.comment
    await review.save()
    await refreshProductRating(review.productId)
    return success(res, review)
  } catch (error) {
    next(error)
  }
}

export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) {
      throw new ApiError(404, 'Review not found')
    }
    if (String(review.userId) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only delete your own reviews')
    }
    const productId = review.productId
    await review.deleteOne()
    await refreshProductRating(productId)
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}
