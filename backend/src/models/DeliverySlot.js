import mongoose from 'mongoose'

const deliverySlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, default: 50 },
    bookedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

deliverySlotSchema.index({ date: 1, label: 1 }, { unique: true })

export const DeliverySlot = mongoose.model('DeliverySlot', deliverySlotSchema)
