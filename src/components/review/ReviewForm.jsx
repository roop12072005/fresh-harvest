import { useState } from 'react'
import { api } from '../../api/client'
import Button from '../ui/Button'

export default function ReviewForm({ productId, orderId, existing, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(!existing)
  const [rating, setRating] = useState(existing?.rating || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!rating) {
      setError('Please select a rating')
      return
    }
    setSaving(true)
    setError('')
    try {
      const path = existing ? `/api/reviews/${existing._id}` : `/api/orders/${orderId}/reviews`
      const body = new FormData()
      body.append('rating', String(rating))
      body.append('comment', comment)
      if (!existing) body.append('productId', productId)
      if (image) body.append('image', image)
      const saved = await api(path, {
        method: existing ? 'PATCH' : 'POST',
        body,
      })
      onSaved(saved)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    setError('')
    try {
      await api(`/api/reviews/${existing._id}`, { method: 'DELETE' })
      onDeleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (existing && !editing) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-primary-700">Review completed ({existing.rating}/5)</span>
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>Change review</Button>
        <Button type="button" size="sm" variant="danger" onClick={remove} disabled={saving}>Delete</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl bg-neutral-50 p-4">
      <p className="text-sm font-medium text-neutral-700">{existing ? 'Edit your review' : 'Rate this product'}</p>
      <div className="mt-2 flex gap-1" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            onClick={() => setRating(value)}
            className={`text-2xl ${value <= rating ? 'text-amber-400' : 'text-neutral-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        maxLength={1000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your experience (optional)"
        className="mt-3 min-h-24 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
      />
      <label className="mt-3 block text-sm font-medium text-neutral-700">
        Product photo <span className="font-normal text-neutral-500">(optional)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] || null)}
          className="mt-1 block w-full text-sm"
        />
      </label>
      {existing?.imageUrl && !image && (
        <img src={existing.imageUrl} alt="Your review" className="mt-3 h-20 w-20 rounded-lg object-cover" />
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving...' : existing ? 'Save review' : 'Submit review'}</Button>
        {existing && <Button type="button" size="sm" variant="danger" onClick={remove} disabled={saving}>Delete</Button>}
      </div>
    </form>
  )
}
