import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import OrderCard from '../components/order/OrderCard'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = () => {
      api('/api/orders')
        .then((data) => {
          if (!cancelled) setOrders(data)
        })
        .catch(() => {
          if (!cancelled) setOrders([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    load()
    const intervalId = window.setInterval(load, 15000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [user])

  if (!user) {
    return (
      <div className="container-app py-16">
        <EmptyState title="Sign in to view orders" actionLabel="Sign in" actionTo="/login" />
      </div>
    )
  }

  return (
    <div className="container-app py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">My Orders</span>
      </nav>
      <h1 className="text-3xl font-bold text-neutral-900">My Orders</h1>
      {loading ? (
        <p className="mt-8 text-neutral-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="You haven't placed any orders yet."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.orderNumber} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
