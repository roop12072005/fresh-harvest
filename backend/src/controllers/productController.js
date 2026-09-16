import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { ApiError, success } from '../utils/apiResponse.js'
import { toProductDto } from '../utils/serializers.js'

const SORT_MAP = {
  featured: { featured: -1, createdAt: -1 },
  'price-low': { salePrice: 1, name: 1 },
  'price-high': { salePrice: -1, name: 1 },
  rating: { 'ratingSummary.average': -1, 'ratingSummary.count': -1 },
  newest: { createdAt: -1 },
}

function discountedPriceExpr() {
  return {
    $round: [
      {
        $multiply: [
          '$price',
          {
            $subtract: [
              1,
              { $divide: [{ $ifNull: ['$discountPercent', 0] }, 100] },
            ],
          },
        ],
      },
      0,
    ],
  }
}

function parseBoolean(value) {
  if (value === true || value === 'true' || value === '1') return true
  if (value === false || value === 'false' || value === '0') return false
  return undefined
}

export async function listProducts(req, res, next) {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      organic,
      inStock,
      deals,
      featured,
      sort = 'featured',
      page = 1,
      limit = 20,
    } = req.query

    const pageNumber = Math.max(Number(page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const match = { active: true }

    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({
        slug: String(category).toLowerCase(),
        active: true,
      }).select('_id')
      if (!categoryDoc) {
        return success(res, {
          items: [],
          pagination: { page: pageNumber, limit: pageSize, total: 0, pages: 0 },
        })
      }
      match.categoryId = categoryDoc._id
    }

    const organicFilter = parseBoolean(organic)
    if (organicFilter !== undefined) match.organic = organicFilter

    const featuredFilter = parseBoolean(featured)
    if (featuredFilter !== undefined) match.featured = featuredFilter

    const inStockFilter = parseBoolean(inStock)
    if (inStockFilter) match.stockQuantity = { $gt: 0 }

    const dealsFilter = parseBoolean(deals)
    if (dealsFilter) match.discountPercent = { $gt: 0 }

    if (minRating) {
      match['ratingSummary.average'] = { $gte: Number(minRating) }
    }

    if (search) {
      const query = String(search).trim()
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const matchingCategories = await Category.find({
        $or: [{ name: regex }, { slug: regex }],
      }).select('_id')
      match.$or = [
        { name: regex },
        { description: regex },
        { origin: regex },
        { categoryId: { $in: matchingCategories.map((item) => item._id) } },
      ]
    }

    const priceMatch = {}
    if (minPrice !== undefined && minPrice !== '') {
      priceMatch.$gte = Number(minPrice)
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      priceMatch.$lte = Number(maxPrice)
    }

    const sortSpec = SORT_MAP[sort] || SORT_MAP.featured

    const pipeline = [
      { $match: match },
      { $addFields: { salePrice: discountedPriceExpr() } },
    ]

    if (Object.keys(priceMatch).length > 0) {
      pipeline.push({ $match: { salePrice: priceMatch } })
    }

    pipeline.push({
      $facet: {
        items: [
          { $sort: sortSpec },
          { $skip: (pageNumber - 1) * pageSize },
          { $limit: pageSize },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'categoryId',
            },
          },
          { $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true } },
        ],
        total: [{ $count: 'count' }],
      },
    })

    const [result] = await Product.aggregate(pipeline)
    const total = result?.total?.[0]?.count || 0
    const items = (result?.items || []).map(toProductDto)

    return success(res, {
      items,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await findProduct(req.params.productId)
    if (!product || !product.active) {
      throw new ApiError(404, 'Product not found')
    }
    return success(res, toProductDto(product))
  } catch (error) {
    next(error)
  }
}

export async function getRelatedProducts(req, res, next) {
  try {
    const product = await findProduct(req.params.productId)
    if (!product || !product.active) {
      throw new ApiError(404, 'Product not found')
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      categoryId: product.categoryId,
      active: true,
    })
      .populate('categoryId')
      .sort({ featured: -1, 'ratingSummary.average': -1 })
      .limit(4)

    return success(res, related.map(toProductDto))
  } catch (error) {
    next(error)
  }
}

async function findProduct(idOrSlug) {
  const query = []
  if (mongoose.Types.ObjectId.isValid(idOrSlug) && String(new mongoose.Types.ObjectId(idOrSlug)) === idOrSlug) {
    query.push({ _id: idOrSlug })
  }
  if (/^\d+$/.test(idOrSlug)) {
    query.push({ legacyId: Number(idOrSlug) })
  }
  query.push({ slug: String(idOrSlug).toLowerCase() })

  return Product.findOne({ $or: query }).populate('categoryId')
}
