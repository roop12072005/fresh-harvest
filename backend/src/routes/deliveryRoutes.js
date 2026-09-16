import { Router } from 'express'
import { listSlots } from '../controllers/deliveryController.js'

const router = Router()
router.get('/', listSlots)

export default router
