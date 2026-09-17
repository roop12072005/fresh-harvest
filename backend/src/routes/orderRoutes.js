import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { cancelMine, create, getMine, listMine, preview } from '../controllers/orderController.js'
import { createOrderReview, getOrderReview } from '../controllers/reviewController.js'
import multer from 'multer'

const reviewUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

router.use(requireAuth)
router.post('/preview', preview)
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('paymentMethod').notEmpty(),
  ],
  validate,
  create
)
router.get('/', listMine)
router.get('/:orderId', getMine)
router.post('/:orderId/cancel', cancelMine)
router.get('/:orderId/reviews', getOrderReview)
router.post('/:orderId/reviews', reviewUpload.single('image'), createOrderReview)

export default router
