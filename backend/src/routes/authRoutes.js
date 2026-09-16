import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import {
  login,
  loginValidators,
  logout,
  me,
  register,
  registerValidators,
} from '../controllers/authController.js'

const router = Router()

router.post('/register', registerValidators, validate, register)
router.post('/login', loginValidators, validate, login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
