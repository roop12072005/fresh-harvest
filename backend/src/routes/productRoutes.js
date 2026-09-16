import { Router } from 'express'
import { query } from 'express-validator'
import { validate } from '../middleware/validate.js'
import {
  getProduct,
  getRelatedProducts,
  listProducts,
} from '../controllers/productController.js'
import { listReviews } from '../controllers/reviewController.js'

const router = Router()

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('sort').optional().isIn(['featured', 'price-low', 'price-high', 'rating', 'newest']),
    query('organic').optional().isIn(['true', 'false', '1', '0']),
    query('inStock').optional().isIn(['true', 'false', '1', '0']),
    query('deals').optional().isIn(['true', 'false', '1', '0']),
    query('featured').optional().isIn(['true', 'false', '1', '0']),
  ],
  validate,
  listProducts
)

router.get('/:productId', getProduct)
router.get('/:productId/related', getRelatedProducts)
router.get('/:productId/reviews', listReviews)
export default router
