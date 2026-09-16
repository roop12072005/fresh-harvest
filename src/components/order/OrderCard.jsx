import { Link } from 'react-router-dom'
import { formatPrice, formatDate } from '../../utils/formatters'
import OrderStatus from './OrderStatus'

export default function OrderCard({ order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">{formatDate(order.date)}</p>
          <p className="mt-1 font-semibold text-neutral-800">Order {order.orderNumber || order.id}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatPrice(order.total)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatus status={order.status} compact />
          <Link
            to={`/orders/${order.orderNumber || order.id}`}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
