import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api, getProductId } from '../api/client'
import { formatPrice } from '../utils/formatters'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

const paymentMethods = [
  { id: 'upi', label: 'UPI via Razorpay', description: 'Google Pay, PhonePe, Paytm and other UPI apps' },
  { id: 'card', label: 'Card via Razorpay', description: 'Visa, Mastercard, RuPay and other cards' },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
]

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { items, subtotal, deliveryFee, total, clearCart, getItemPrice } = useCart()
  const [deliverySlots, setDeliverySlots] = useState([])
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  })
  const [deliverySlotId, setDeliverySlotId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [addressChoice, setAddressChoice] = useState('new')

  useEffect(() => {
    const savedAddress = user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0]
    if (!savedAddress) return
    setAddressChoice(String(savedAddress._id))
    setForm({
      fullName: savedAddress.fullName || user.name,
      phone: savedAddress.phone || user.phone,
      address: savedAddress.addressLine1 || '',
      city: savedAddress.city || '',
      state: savedAddress.state || '',
      postalCode: savedAddress.postalCode || '',
    })
  }, [user])

  useEffect(() => {
    api('/api/delivery-slots').then(setDeliverySlots).catch(() => setDeliverySlots([]))
  }, [])

  useEffect(() => {
    if (!user || items.length === 0 || !deliverySlotId) {
      setPreview(null)
      return
    }
    api('/api/orders/preview', {
      method: 'POST',
      body: {
        items: items.map((item) => ({ productId: getProductId(item), quantity: Number(item.quantity) })),
        deliverySlotId,
      },
    })
      .then(setPreview)
      .catch(() => setPreview(null))
  }, [user, items, deliverySlotId])

  useEffect(() => {
    if (!authLoading && !user && items.length > 0) {
      navigate('/register', { replace: true, state: { from: '/checkout' } })
    }
  }, [authLoading, user, items.length, navigate])

  if (!user) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="Sign in to checkout"
          description="Create an account or sign in to place your order with live prices and delivery slots."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="Nothing to checkout"
          description="Your cart is empty. Add some products before proceeding to checkout."
          actionLabel="Browse Products"
          actionTo="/products"
        />
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (!form.address.trim()) nextErrors.address = 'Address is required'
    if (!form.city.trim()) nextErrors.city = 'City is required'
    if (!form.state.trim()) nextErrors.state = 'State is required'
    if (!form.postalCode.trim()) nextErrors.postalCode = 'Postal code is required'
    if (!deliverySlotId) nextErrors.deliverySlot = 'Please select a delivery slot'
    if (!paymentMethod) nextErrors.paymentMethod = 'Please select a payment method'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await api('/api/orders', {
        method: 'POST',
        body: {
          items: items.map((item) => ({
            productId: getProductId(item),
            quantity: Number(item.quantity),
          })),
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            addressLine1: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: 'India',
          },
          paymentMethod,
          deliverySlotId,
        },
      })

      if (paymentMethod === 'cod') {
        await clearCart()
        navigate('/order-success', { state: { order: result.order } })
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !result.razorpay) {
        throw new Error('Unable to load Razorpay. Please try again or choose Cash on Delivery.')
      }

      const razorpay = new window.Razorpay({
        key: result.razorpay.keyId,
        amount: result.razorpay.amount,
        currency: result.razorpay.currency,
        name: 'FreshHarvest',
        description: `Payment for order ${result.order.orderNumber}`,
        order_id: result.razorpay.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: {
          color: '#16a34a',
        },
        handler: async (response) => {
          try {
            const paidOrder = await api('/api/payments/verify', {
              method: 'POST',
              body: response,
            })
            await clearCart()
            navigate('/order-success', { state: { order: paidOrder } })
          } catch (err) {
            setSubmitError(err.message)
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      })

      razorpay.on('payment.failed', (response) => {
        setSubmitError(response.error?.description || 'Payment failed. Please try again.')
        setSubmitting(false)
      })
      razorpay.open()
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  const displaySubtotal = preview?.subtotal ?? subtotal
  const displayFee = preview?.deliveryFee ?? deliveryFee
  const displayTotal = preview?.total ?? total

  const inputClass = (field) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none ${
      errors[field] ? 'border-red-300' : 'border-neutral-200 focus:border-primary-500'
    }`

  return (
    <div className="container-app py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/cart" className="hover:text-primary-600">Cart</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">Checkout</span>
      </nav>
      <h1 className="text-3xl font-bold text-neutral-900">Checkout</h1>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Delivery Address</h2>
              {user.addresses?.length > 0 && (
                <select
                  value={addressChoice}
                  onChange={(event) => {
                    const value = event.target.value
                    setAddressChoice(value)
                    if (value === 'new') {
                      setForm({ fullName: user.name, phone: user.phone, address: '', city: '', state: '', postalCode: '' })
                      return
                    }
                    const savedAddress = user.addresses.find((address) => String(address._id) === value)
                    if (savedAddress) {
                      setForm({
                        fullName: savedAddress.fullName || '',
                        phone: savedAddress.phone || '',
                        address: savedAddress.addressLine1 || '',
                        city: savedAddress.city || '',
                        state: savedAddress.state || '',
                        postalCode: savedAddress.postalCode || '',
                      })
                    }
                  }}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  aria-label="Choose delivery address"
                >
                  {user.addresses.map((address) => <option key={address._id} value={address._id}>{address.label || 'Saved address'} - {address.city}</option>)}
                  <option value="new">Enter a new address</option>
                </select>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {addressChoice === 'new' ? 'Enter a new delivery address.' : 'Using your saved address.'}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium">Full Name</label>
                <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className={inputClass('fullName')} />
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass('phone')} />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="postalCode" className="mb-1 block text-sm font-medium">Postal Code</label>
                <input id="postalCode" name="postalCode" value={form.postalCode} onChange={handleChange} className={inputClass('postalCode')} />
                {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-1 block text-sm font-medium">Address</label>
                <textarea id="address" name="address" rows={2} value={form.address} onChange={handleChange} className={inputClass('address')} />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} className={inputClass('city')} />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium">State</label>
                <input id="state" name="state" value={form.state} onChange={handleChange} className={inputClass('state')} />
                {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Delivery Slot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {deliverySlots.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    deliverySlotId === slot.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliverySlot"
                    value={slot.id}
                    checked={deliverySlotId === slot.id}
                    onChange={() => setDeliverySlotId(slot.id)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm font-medium">{slot.label}</span>
                </label>
              ))}
            </div>
            {errors.deliverySlot && <p className="mt-2 text-xs text-red-600">{errors.deliverySlot}</p>}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Payment Method</h2>
            <div className="mt-4 space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="accent-primary-600"
                  />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-neutral-400">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="mt-2 text-xs text-red-600">{errors.paymentMethod}</p>}
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <ul className="mt-4 max-h-60 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <li key={getProductId(item)} className="flex items-center gap-3 text-sm">
                  <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-neutral-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatPrice(getItemPrice(item) * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{formatPrice(displaySubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Delivery</dt>
                <dd>{displayFee === 0 ? 'FREE' : formatPrice(displayFee)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(displayTotal)}</dd>
              </div>
            </dl>
            {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
