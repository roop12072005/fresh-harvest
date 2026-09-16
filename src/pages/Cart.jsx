import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatters'
import CartItem from '../components/cart/CartItem'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function Cart() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    amountForFreeDelivery,
  } = useCart()

  const proceedToCheckout = () => {
    navigate(user ? '/checkout' : '/register', {
      state: user ? undefined : { from: '/checkout' },
    })
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Your cart is empty"
          description="Looks like you haven't added any fresh produce yet. Start shopping to fill your cart!"
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      </div>
    )
  }

  return (
    <div className="container-app py-8 lg:py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Shopping Cart</h1>
      <p className="mt-1 text-neutral-500">{items.length} unique item{items.length !== 1 ? 's' : ''} in your cart</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-neutral-800">Order Summary</h2>

            {amountForFreeDelivery > 0 && (
              <div className="mt-4 rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
                Add {formatPrice(amountForFreeDelivery)} more to get <strong>FREE delivery</strong>
              </div>
            )}

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="font-medium text-neutral-800">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Delivery Fee</dt>
                <dd className="font-medium text-neutral-800">
                  {deliveryFee === 0 ? (
                    <span className="text-primary-600">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-3 text-base">
                <dt className="font-semibold text-neutral-800">Total</dt>
                <dd className="font-bold text-neutral-900">{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3">
              <Button size="lg" className="w-full" onClick={proceedToCheckout}>
                {user ? 'Proceed to Checkout' : 'Sign up to Checkout'}
              </Button>
              <Link to="/products">
                <Button variant="secondary" size="lg" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
