import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { formatPrice, formatDate } from '../utils/formatters'
import OrderStatus from '../components/order/OrderStatus'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

export default function OrderDetails() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = () => {
      api(`/api/orders/${orderId}`)
        .then((data) => {
          if (!cancelled) {
            setOrder(data)
            setError('')
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
    }
    load()
    const intervalId = window.setInterval(load, 15000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [orderId])

  if (error) {
    return (
      <div className="container-app py-16">
        <EmptyState title="Order not found" description={error} actionLabel="View All Orders" actionTo="/orders" />
      </div>
    )
  }

  if (!order) {
    return <div className="container-app py-16 text-neutral-500">Loading order...</div>
  }

  const cancel = async () => {
    const updated = await api(`/api/orders/${order.orderNumber}/cancel`, { method: 'POST' })
    setOrder(updated)
  }

  return (
    <div className="container-app py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/orders" className="hover:text-primary-600">Orders</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{order.orderNumber}</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="mt-1 text-neutral-500">Placed on {formatDate(order.date)}</p>
        </div>
        <OrderStatus status={order.status} compact />
      </div>
      <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Order Progress</h2>
        <div className="mt-6">
          <OrderStatus status={order.status} />
        </div>
        {order.statusHistory?.length > 0 && (
          <ol className="mt-8 space-y-4 border-l-2 border-primary-100 pl-5">
            {[...order.statusHistory].reverse().map((entry, index) => (
              <li key={`${entry.status}-${entry.at}-${index}`} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary-600 ring-4 ring-white" />
                <p className="text-sm font-semibold text-neutral-800">
                  {formatStatus(entry.status)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(entry.at)}
                  {entry.note ? ` · ${entry.note}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
        {order.cancellationReason && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {order.cancellationReason}
          </p>
        )}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-4">
                <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-neutral-500">{formatPrice(item.price)} / {item.unit} × {item.quantity}</p>
                </div>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t pt-2 font-bold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
            {(order.statusKey === 'placed' || order.statusKey === 'confirmed') && (
              <Button variant="danger" className="mt-4 w-full" onClick={cancel}>Cancel order</Button>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Delivery Info</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-neutral-500">Address</dt>
                <dd className="mt-1 font-medium">
                  {order.address.fullName}<br />
                  {order.address.address || order.address.addressLine1}<br />
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </dd>
              </div>
              <div><dt className="text-neutral-500">Delivery Slot</dt><dd className="font-medium">{order.deliverySlot}</dd></div>
              <div><dt className="text-neutral-500">Payment</dt><dd className="font-medium">{order.paymentMethod}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatStatus(status) {
  return {
    placed: 'Placed',
    confirmed: 'Confirmed',
    packing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }[status] || status
}
