import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js'

const router = Router()

router.use(requireAuth)
router.get('/', getCart)
router.post(
  '/items',
  [body('productId').notEmpty(), body('quantity').optional().isInt({ min: 1 })],
  validate,
  addCartItem
)
router.patch(
  '/items/:productId',
  [body('quantity').isInt({ min: 1 })],
  validate,
  updateCartItem
)
router.delete('/items/:productId', removeCartItem)
router.delete('/', clearCart)

export default router
