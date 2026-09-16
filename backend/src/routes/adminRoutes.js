import { Router } from 'express'
import multer from 'multer'
import { validate } from '../middleware/validate.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import {
  adminCreateCategory,
  adminCreateProduct,
  adminCancelOrder,
  adminDashboard,
  adminDeleteCategory,
  adminDeleteProduct,
  adminGetCustomer,
  adminGetOrder,
  adminGetProduct,
  adminInventory,
  adminListCategories,
  adminListCustomers,
  adminListOrders,
  adminListProducts,
  adminLogin,
  adminLoginValidators,
  adminLogout,
  adminMe,
  adminUpdateCategory,
  adminUpdateCategoryStatus,
  adminUpdateCustomerStatus,
  adminUpdateInventory,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminUpdateProductStatus,
} from '../controllers/adminController.js'
import { createSlot, updateSlot } from '../controllers/deliveryController.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

router.post('/login', adminLoginValidators, validate, adminLogin)
router.post('/logout', adminLogout)

router.use(requireAdmin)
router.get('/me', adminMe)
router.get('/dashboard', adminDashboard)

router.get('/products', adminListProducts)
router.get('/products/:productId', adminGetProduct)
router.post('/products', upload.single('image'), adminCreateProduct)
router.patch('/products/:productId', upload.single('image'), adminUpdateProduct)
router.patch('/products/:productId/status', adminUpdateProductStatus)
router.delete('/products/:productId', adminDeleteProduct)

router.get('/categories', adminListCategories)
router.post('/categories', adminCreateCategory)
router.patch('/categories/:categoryId', adminUpdateCategory)
router.patch('/categories/:categoryId/status', adminUpdateCategoryStatus)
router.delete('/categories/:categoryId', adminDeleteCategory)

router.get('/orders', adminListOrders)
router.post('/cancel-order', adminCancelOrder)
router.post('/orders/cancel/:orderId', adminCancelOrder)
router.post('/orders/:orderId/cancel', adminCancelOrder)
router.post('/orders/:orderId/cancel-order', adminCancelOrder)
router.patch('/orders/:orderId/status', adminUpdateOrderStatus)
router.get('/orders/:orderId', adminGetOrder)

router.get('/inventory', adminInventory)
router.patch('/inventory/:productId', adminUpdateInventory)

router.get('/customers', adminListCustomers)
router.get('/customers/:customerId', adminGetCustomer)
router.patch('/customers/:customerId/status', adminUpdateCustomerStatus)

router.post('/delivery-slots', createSlot)
router.patch('/delivery-slots/:slotId', updateSlot)

export default router
