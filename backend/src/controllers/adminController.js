import bcrypt from 'bcrypt'
import { body } from 'express-validator'
import mongoose from 'mongoose'
import { Admin } from '../models/Admin.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { Order } from '../models/Order.js'
import { Cart } from '../models/Cart.js'
import { Wishlist } from '../models/Wishlist.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/tokens.js'
import { slugify } from '../models/Category.js'
import { saveProductImage, deleteProductImage } from '../services/imageService.js'
import { toProductDto, toCategoryDto } from '../utils/serializers.js'
import { assertTransition } from '../services/orderService.js'
import { toOrderDto } from './orderController.js'
import { incrementStock } from '../services/inventoryService.js'

export const adminLoginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

function toPublicAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
}

export async function adminLogin(req, res, next) {
  try {
    const admin = await Admin.findOne({ email: req.body.email }).select('+passwordHash')
    if (!admin) {
      throw new ApiError(401, 'Invalid email or password')
    }
    if (!admin.active) {
      throw new ApiError(403, 'Admin account is inactive')
    }
    const ok = await bcrypt.compare(req.body.password, admin.passwordHash)
    if (!ok) {
      throw new ApiError(401, 'Invalid email or password')
    }
    const token = signToken({ sub: String(admin._id), type: 'admin', role: admin.role })
    setAuthCookie(res, token, 'admin')
    return success(res, toPublicAdmin(admin))
  } catch (error) {
    next(error)
  }
}

export async function adminMe(req, res, next) {
  try {
    return success(res, toPublicAdmin(req.admin))
  } catch (error) {
    next(error)
  }
}

export async function adminLogout(req, res, next) {
  try {
    clearAuthCookie(res, 'admin')
    return success(res, { loggedOut: true })
  } catch (error) {
    next(error)
  }
}

export async function adminDashboard(req, res, next) {
  try {
    const [totalOrders, totalCustomers, totalProducts, revenue, lowStock, recentOrders, bestSelling] =
      await Promise.all([
        Order.countDocuments({ status: { $nin: ['cancelled'] } }),
        User.countDocuments(),
        Product.countDocuments(),
        Order.aggregate([
          { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.total' } } },
        ]),
        Product.find({
          active: true,
          $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
        })
          .select('name stockQuantity lowStockThreshold')
          .limit(20),
        Order.find().sort({ createdAt: -1 }).limit(8),
        Order.aggregate([
          { $match: { status: { $nin: ['cancelled'] } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              name: { $first: '$items.name' },
              quantity: { $sum: '$items.quantity' },
              revenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 8 },
        ]),
      ])

    return success(res, {
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStock,
      recentOrders: recentOrders.map(toOrderDto),
      bestSellingProducts: bestSelling,
    })
  } catch (error) {
    next(error)
  }
}

export async function adminListProducts(req, res, next) {
  try {
    const products = await Product.find().populate('categoryId').sort({ createdAt: -1 })
    return success(res, products.map(toProductDto))
  } catch (error) {
    next(error)
  }
}

export async function adminGetProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId).populate('categoryId')
    if (!product) throw new ApiError(404, 'Product not found')
    return success(res, toProductDto(product))
  } catch (error) {
    next(error)
  }
}

export async function adminCreateProduct(req, res, next) {
  try {
    let imageUrl = req.body.imageUrl
    if (req.file) {
      imageUrl = await saveProductImage(req.file)
    }
    if (!imageUrl) {
      throw new ApiError(400, 'Product image is required')
    }
    const product = await Product.create({
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name),
      categoryId: req.body.categoryId,
      description: req.body.description,
      price: Number(req.body.price),
      discountPercent: Number(req.body.discountPercent || 0),
      unit: req.body.unit,
      imageUrl,
      organic: req.body.organic === 'true' || req.body.organic === true,
      stockQuantity: Number(req.body.stockQuantity || 0),
      lowStockThreshold: Number(req.body.lowStockThreshold || 10),
      origin: req.body.origin || '',
      featured: req.body.featured === 'true' || req.body.featured === true,
      active: req.body.active !== 'false' && req.body.active !== false,
    })
    await product.populate('categoryId')
    return created(res, toProductDto(product))
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) throw new ApiError(404, 'Product not found')

    if (req.file) {
      const nextUrl = await saveProductImage(req.file)
      await deleteProductImage(product.imageUrl)
      product.imageUrl = nextUrl
    }

    const fields = [
      'name',
      'slug',
      'categoryId',
      'description',
      'price',
      'discountPercent',
      'unit',
      'imageUrl',
      'origin',
      'stockQuantity',
      'lowStockThreshold',
    ]
    for (const field of fields) {
      if (req.body[field] !== undefined) product[field] = req.body[field]
    }
    if (req.body.organic !== undefined) product.organic = req.body.organic === 'true' || req.body.organic === true
    if (req.body.featured !== undefined) product.featured = req.body.featured === 'true' || req.body.featured === true
    await product.save()
    await product.populate('categoryId')
    return success(res, toProductDto(product))
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateProductStatus(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { active: req.body.active },
      { new: true }
    ).populate('categoryId')
    if (!product) throw new ApiError(404, 'Product not found')
    return success(res, toProductDto(product))
  } catch (error) {
    next(error)
  }
}

export async function adminDeleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) throw new ApiError(404, 'Product not found')
    await deleteProductImage(product.imageUrl)
    await product.deleteOne()
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}

export async function adminListCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 })
    return success(res, categories.map(toCategoryDto))
  } catch (error) {
    next(error)
  }
}

export async function adminCreateCategory(req, res, next) {
  try {
    const category = await Category.create({
      name: req.body.name,
      slug: req.body.slug || slugify(req.body.name),
      imageUrl: req.body.imageUrl,
      description: req.body.description || '',
      active: req.body.active !== false,
      displayOrder: req.body.displayOrder || 0,
    })
    return created(res, toCategoryDto(category))
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.categoryId, req.body, {
      new: true,
      runValidators: true,
    })
    if (!category) throw new ApiError(404, 'Category not found')
    return success(res, toCategoryDto(category))
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateCategoryStatus(req, res, next) {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { active: req.body.active },
      { new: true }
    )
    if (!category) throw new ApiError(404, 'Category not found')
    return success(res, toCategoryDto(category))
  } catch (error) {
    next(error)
  }
}

export async function adminDeleteCategory(req, res, next) {
  try {
    const inUse = await Product.exists({ categoryId: req.params.categoryId })
    if (inUse) {
      throw new ApiError(409, 'Cannot delete a category that still has products')
    }
    const category = await Category.findByIdAndDelete(req.params.categoryId)
    if (!category) throw new ApiError(404, 'Category not found')
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}

export async function adminListOrders(req, res, next) {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100)
    return success(res, orders.map(toOrderDto))
  } catch (error) {
    next(error)
  }
}

export async function adminGetOrder(req, res, next) {
  try {
    let order = await Order.findOne({ orderNumber: req.params.orderId })
    if (!order && mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      order = await Order.findById(req.params.orderId)
    }
    if (!order) throw new ApiError(404, 'Order not found')
    return success(res, toOrderDto(order))
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateOrderStatus(req, res, next) {
  try {
    let order = await Order.findOne({ orderNumber: req.params.orderId })
    if (!order && mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      order = await Order.findById(req.params.orderId)
    }
    if (!order) throw new ApiError(404, 'Order not found')
    assertTransition(order.status, req.body.status)
    order.status = req.body.status
    order.statusHistory.push({ status: req.body.status, note: req.body.note || 'Updated by admin' })
    await order.save()
    return success(res, toOrderDto(order))
  } catch (error) {
    next(error)
  }
}

export async function adminCancelOrder(req, res, next) {
  try {
    const orderId = req.params.orderId || req.body.orderId || req.body.orderNumber
    let order = await Order.findOne({ orderNumber: orderId })
    if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
    }
    if (!order) throw new ApiError(404, 'Order not found')
    if (!['placed', 'confirmed', 'packing'].includes(order.status)) {
      throw new ApiError(409, 'This order can no longer be cancelled')
    }

    const shouldRestock = req.body.restock !== false
    const note = String(req.body.reason || '').trim() || 'Cancelled by admin'

    order.status = order.payment.status === 'paid' ? 'refunded' : 'cancelled'
    if (order.payment.status === 'paid') {
      order.payment.status = 'refunded'
    }
    order.statusHistory.push({
      status: order.status,
      note: `${note}${shouldRestock ? ' Stock restored.' : ' Stock was not restored.'}`,
    })
    await order.save()

    if (shouldRestock) {
      for (const item of order.items) {
        await incrementStock(item.productId, item.quantity)
      }
    }

    return success(res, toOrderDto(order))
  } catch (error) {
    next(error)
  }
}

export async function adminInventory(req, res, next) {
  try {
    const products = await Product.find()
      .select('name stockQuantity lowStockThreshold active')
      .sort({ stockQuantity: 1 })
    return success(res, products)
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateInventory(req, res, next) {
  try {
    const stockQuantity = Number(req.body.stockQuantity)
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      throw new ApiError(400, 'stockQuantity must be 0 or greater')
    }
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        stockQuantity,
        ...(req.body.lowStockThreshold !== undefined
          ? { lowStockThreshold: Number(req.body.lowStockThreshold) }
          : {}),
      },
      { new: true, runValidators: true }
    )
    if (!product) throw new ApiError(404, 'Product not found')
    return success(res, product)
  } catch (error) {
    next(error)
  }
}

export async function adminListCustomers(req, res, next) {
  try {
    const customers = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean()
    const customerIds = customers.map((customer) => customer._id)
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: customerIds } } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $in: ['$status', ['cancelled', 'refunded']] },
                0,
                '$pricing.total',
              ],
            },
          },
          lastOrderAt: { $max: '$createdAt' },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['placed', 'confirmed', 'packing', 'out_for_delivery']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ])
    const statsByUser = new Map(orderStats.map((item) => [String(item._id), item]))
    return success(
      res,
      customers.map((customer) => {
        const stats = statsByUser.get(String(customer._id)) || {}
        return {
          ...customer,
          orderCount: stats.orderCount || 0,
          totalSpent: stats.totalSpent || 0,
          lastOrderAt: stats.lastOrderAt || null,
          deliveredCount: stats.deliveredCount || 0,
          pendingCount: stats.pendingCount || 0,
        }
      })
    )
  } catch (error) {
    next(error)
  }
}

export async function adminGetCustomer(req, res, next) {
  try {
    const customer = await User.findById(req.params.customerId).select('-passwordHash').lean()
    if (!customer) throw new ApiError(404, 'Customer not found')
    const [orders, cart, wishlistCount] = await Promise.all([
      Order.find({ userId: customer._id }).sort({ createdAt: -1 }).limit(20),
      Cart.findOne({ userId: customer._id }).populate('items.productId'),
      Wishlist.countDocuments({ userId: customer._id }),
    ])
    const activeOrders = orders.filter((order) =>
      ['placed', 'confirmed', 'packing', 'out_for_delivery'].includes(order.status)
    )
    const completedOrders = orders.filter((order) => order.status === 'delivered')
    const cancelledOrders = orders.filter((order) => ['cancelled', 'refunded'].includes(order.status))
    const totalSpent = orders.reduce((sum, order) => {
      if (['cancelled', 'refunded'].includes(order.status)) return sum
      return sum + (order.pricing?.total || 0)
    }, 0)

    return success(res, {
      customer,
      stats: {
        orderCount: orders.length,
        activeOrderCount: activeOrders.length,
        deliveredOrderCount: completedOrders.length,
        cancelledOrderCount: cancelledOrders.length,
        totalSpent,
        wishlistCount,
        cartItemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        lastOrderAt: orders[0]?.createdAt || null,
      },
      recentOrders: orders.map(toOrderDto),
      cart: {
        items: (cart?.items || []).map((item) => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || 'Unknown product',
          quantity: item.quantity,
        })),
      },
      activity: [
        ...orders.slice(0, 8).map((order) => ({
          id: order._id,
          type: 'order',
          at: order.createdAt,
          label: `${order.orderNumber} ${order.status.replaceAll('_', ' ')}`,
        })),
        ...(cart?.updatedAt
          ? [{ id: `${customer._id}-cart`, type: 'cart', at: cart.updatedAt, label: 'Cart updated' }]
          : []),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)),
    })
  } catch (error) {
    next(error)
  }
}

export async function adminUpdateCustomerStatus(req, res, next) {
  try {
    const customer = await User.findByIdAndUpdate(
      req.params.customerId,
      { active: req.body.active },
      { new: true }
    ).select('-passwordHash')
    if (!customer) throw new ApiError(404, 'Customer not found')
    return success(res, customer)
  } catch (error) {
    next(error)
  }
}
