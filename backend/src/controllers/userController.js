import { body } from 'express-validator'
import { success, created } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'
import { toPublicUser } from './authController.js'

export const profileValidators = [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
]

export const addressValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('addressLine1').optional().trim(),
  body('address').optional().trim(),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('label').optional().isIn(['Home', 'Work', 'Other']),
]

function normalizeAddress(bodyData) {
  return {
    label: bodyData.label || 'Home',
    fullName: bodyData.fullName,
    phone: bodyData.phone,
    addressLine1: bodyData.addressLine1 || bodyData.address || '',
    addressLine2: bodyData.addressLine2 || '',
    city: bodyData.city,
    state: bodyData.state,
    postalCode: bodyData.postalCode,
    country: bodyData.country || 'India',
    landmark: bodyData.landmark || '',
    isDefault: Boolean(bodyData.isDefault),
  }
}

export async function getProfile(req, res, next) {
  try {
    return success(res, toPublicUser(req.user))
  } catch (error) {
    next(error)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body
    if (name) req.user.name = name
    if (phone && phone !== req.user.phone) {
      req.user.phone = phone
    }
    await req.user.save()
    return success(res, toPublicUser(req.user))
  } catch (error) {
    next(error)
  }
}

export async function addAddress(req, res, next) {
  try {
    const address = normalizeAddress(req.body)
    if (!address.addressLine1) {
      throw new ApiError(400, 'Address is required')
    }
    if (address.isDefault || req.user.addresses.length === 0) {
      req.user.addresses.forEach((item) => {
        item.isDefault = false
      })
      address.isDefault = true
    }
    req.user.addresses.push(address)
    await req.user.save()
    return created(res, req.user.addresses.at(-1))
  } catch (error) {
    next(error)
  }
}

export async function updateAddress(req, res, next) {
  try {
    const address = req.user.addresses.id(req.params.addressId)
    if (!address) {
      throw new ApiError(404, 'Address not found')
    }
    const nextAddress = normalizeAddress({ ...address.toObject(), ...req.body })
    Object.assign(address, nextAddress)
    if (address.isDefault) {
      req.user.addresses.forEach((item) => {
        if (String(item._id) !== String(address._id)) item.isDefault = false
      })
    }
    await req.user.save()
    return success(res, address)
  } catch (error) {
    next(error)
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const address = req.user.addresses.id(req.params.addressId)
    if (!address) {
      throw new ApiError(404, 'Address not found')
    }
    address.deleteOne()
    if (req.user.addresses.length && !req.user.addresses.some((item) => item.isDefault)) {
      req.user.addresses[0].isDefault = true
    }
    await req.user.save()
    return success(res, { deleted: true })
  } catch (error) {
    next(error)
  }
}
