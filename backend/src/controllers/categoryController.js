import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { ApiError, success } from '../utils/apiResponse.js'
import { toCategoryDto } from '../utils/serializers.js'

export async function listCategories(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true'
    const filter = includeInactive ? {} : { active: true }
    const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 })
    return success(res, categories.map(toCategoryDto))
  } catch (error) {
    next(error)
  }
}

export async function getCategory(req, res, next) {
  try {
    const { categoryId } = req.params
    let category = await Category.findOne({ slug: String(categoryId).toLowerCase(), active: true })

    if (
      !category &&
      mongoose.Types.ObjectId.isValid(categoryId) &&
      String(new mongoose.Types.ObjectId(categoryId)) === categoryId
    ) {
      category = await Category.findOne({ _id: categoryId, active: true })
    }

    if (!category) {
      throw new ApiError(404, 'Category not found')
    }

    return success(res, toCategoryDto(category))
  } catch (error) {
    next(error)
  }
}
