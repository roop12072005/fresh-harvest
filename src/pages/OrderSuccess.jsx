import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../utils/formatters'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function OrderSuccess() {
  const { state } = useLocation()
  const lastOrder = state?.order

  if (!lastOrder) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="No recent order found"
          description="If you just placed an order, open My Orders to find it."
          actionLabel="View Orders"
          actionTo="/orders"
        />
      </div>
    )
  }

  return (
    <div className="container-app py-16 lg:py-24">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold">Order Placed Successfully!</h1>
        <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-6 text-left shadow-[var(--shadow-card)]">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Order ID</dt>
              <dd className="font-semibold">{lastOrder.orderNumber || lastOrder.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Total</dt>
              <dd className="font-semibold">{formatPrice(lastOrder.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery Slot</dt>
              <dd className="font-medium">{lastOrder.deliverySlot}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Delivery Address</dt>
              <dd className="mt-1 font-medium">
                {lastOrder.address?.fullName}<br />
                {lastOrder.address?.address || lastOrder.address?.addressLine1}<br />
                {lastOrder.address?.city}, {lastOrder.address?.state} {lastOrder.address?.postalCode}
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/orders/${lastOrder.orderNumber || lastOrder.id}`}>
            <Button size="lg">View Order</Button>
          </Link>
          <Link to="/products">
            <Button size="lg" variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
