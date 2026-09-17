import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { deleteReview, updateReview } from '../controllers/reviewController.js'

export const reviewRouter = Router()
const reviewUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
reviewRouter.patch('/:reviewId', requireAuth, reviewUpload.single('image'), updateReview)
reviewRouter.delete('/:reviewId', requireAuth, deleteReview)
