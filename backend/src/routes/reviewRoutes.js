import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from '../controllers/reviewController.js'

export const productReviewRouter = Router({ mergeParams: true })
productReviewRouter.get('/', listReviews)
productReviewRouter.post('/', requireAuth, createReview)

export const reviewRouter = Router()
reviewRouter.patch('/:reviewId', requireAuth, updateReview)
reviewRouter.delete('/:reviewId', requireAuth, deleteReview)
