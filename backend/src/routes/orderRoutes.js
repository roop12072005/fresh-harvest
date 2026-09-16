import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { cancelMine, create, getMine, listMine, preview } from '../controllers/orderController.js'

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

export default router
