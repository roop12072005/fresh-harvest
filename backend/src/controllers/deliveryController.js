import { DeliverySlot } from '../models/DeliverySlot.js'
import { created, success } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiResponse.js'

const DEFAULT_LABELS = ['10 AM - 12 PM', '12 PM - 2 PM', '4 PM - 6 PM', '6 PM - 8 PM']

export async function listSlots(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    let slots = await DeliverySlot.find({ date, active: true }).sort({ label: 1 })
    if (slots.length === 0) {
      try {
        slots = await DeliverySlot.insertMany(
          DEFAULT_LABELS.map((label) => ({
            date,
            label,
            capacity: 50,
            bookedCount: 0,
            active: true,
          }))
        )
      } catch {
        slots = await DeliverySlot.find({ date, active: true }).sort({ label: 1 })
      }
    }
    return success(
      res,
      slots.map((slot) => ({
        id: slot._id,
        date: slot.date,
        label: slot.label,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        remaining: Math.max(slot.capacity - slot.bookedCount, 0),
        active: slot.active,
      }))
    )
  } catch (error) {
    next(error)
  }
}

export async function createSlot(req, res, next) {
  try {
    const slot = await DeliverySlot.create({
      date: req.body.date,
      label: req.body.label,
      capacity: req.body.capacity || 50,
      bookedCount: 0,
      active: req.body.active !== false,
    })
    return created(res, slot)
  } catch (error) {
    next(error)
  }
}

export async function updateSlot(req, res, next) {
  try {
    const slot = await DeliverySlot.findByIdAndUpdate(req.params.slotId, req.body, {
      new: true,
      runValidators: true,
    })
    if (!slot) {
      throw new ApiError(404, 'Delivery slot not found')
    }
    return success(res, slot)
  } catch (error) {
    next(error)
  }
}
