import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import {
  addAddress,
  addressValidators,
  deleteAddress,
  getProfile,
  profileValidators,
  updateAddress,
  updateProfile,
} from '../controllers/userController.js'

const router = Router()

router.use(requireAuth)
router.get('/', getProfile)
router.patch('/', profileValidators, validate, updateProfile)
router.post('/addresses', addressValidators, validate, addAddress)
router.patch('/addresses/:addressId', addressValidators, validate, updateAddress)
router.delete('/addresses/:addressId', deleteAddress)

export default router
