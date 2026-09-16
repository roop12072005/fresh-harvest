import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from '../controllers/wishlistController.js'

const router = Router()

router.use(requireAuth)
router.get('/', getWishlist)
router.post('/:productId', addWishlistItem)
router.delete('/:productId', removeWishlistItem)

export default router
