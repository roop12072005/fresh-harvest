import { Review } from '../models/Review.js'
import { Order } from '../models/Order.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { saveReviewImage, toAbsoluteImageUrl } from '../services/imageService.js'

function toReviewDto(review) {
  return {
    ...review.toObject(),
    imageUrl: toAbsoluteImageUrl(review.imageUrl),
  }
}

export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({ productId: req.params.productId, approved: true })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
    return success(res, reviews.map((review) => ({
      id: review._id,
      author: review.userId?.name || 'Customer',
      rating: review.rating,
      date: review.createdAt,
      comment: review.comment,
      imageUrl: toAbsoluteImageUrl(review.imageUrl),
      verifiedPurchase: review.verifiedPurchase,
    })))
  } catch (error) {
    next(error)
  }
}

export async function getOrderReview(req, res, next) {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.orderId }, { orderNumber: req.params.orderId }],
      userId: req.user._id,
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    const reviews = await Review.find({ orderId: order._id, userId: req.user._id })
    return success(res, reviews.map(toReviewDto))
  } catch (error) {
    next(error)
  }
}

export async function createOrderReview(req, res, next) {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.orderId }, { orderNumber: req.params.orderId }],
      userId: req.user._id,
      status: 'delivered',
    })
    if (!order) throw new ApiError(403, 'You can only review delivered orders')
    const product = order.items.find((item) => String(item.productId) === String(req.body.productId))
    if (!product) throw new ApiError(400, 'Product was not part of this order')
    const rating = Number(req.body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5')
    }

    let review
    try {
      review = await Review.create({
        userId: req.user._id,
        orderId: order._id,
        productId: product.productId,
        imageUrl: await saveReviewImage(req.file),
        rating,
        comment: req.body.comment || '',
        verifiedPurchase: true,
        approved: true,
      })
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'You have already reviewed this product in this order')
      }
      throw error
    }
    return created(res, toReviewDto(review))
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
    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ApiError(400, 'Rating must be between 1 and 5')
      }
      review.rating = rating
    }
    if (typeof req.body.comment === 'string' && req.body.comment.length > 1000) {
      throw new ApiError(400, 'Review comment must be 1000 characters or fewer')
    }
    if (req.body.comment !== undefined) review.comment = req.body.comment
    if (req.file) review.imageUrl = await saveReviewImage(req.file)
    await review.save()
    return success(res, toReviewDto(review))
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
    await review.deleteOne()
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}
