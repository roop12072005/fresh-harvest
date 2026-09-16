import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env, isProduction } from './config/env.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import deliveryRoutes from './routes/deliveryRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { reviewRouter } from './routes/reviewRoutes.js'
import { paymentWebhook } from './controllers/paymentController.js'
import { success } from './utils/apiResponse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )
  app.use(
    cors({
      origin: [env.clientUrl, env.adminUrl, ...env.corsOrigins, 'http://localhost:5175'],
      credentials: true,
    })
  )
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 400,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )
  app.use(morgan(isProduction ? 'combined' : 'dev'))

  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentWebhook
  )

  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

  app.get('/api/health', (req, res) => {
    return success(res, {
      service: 'freshcart-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
  })

  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/profile', userRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/wishlist', wishlistRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/delivery-slots', deliveryRoutes)
  app.use('/api/payments', paymentRoutes)
  app.use('/api/reviews', reviewRouter)
  app.use('/api/admin', adminRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
