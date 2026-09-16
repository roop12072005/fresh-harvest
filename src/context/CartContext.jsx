import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getProductId } from '../api/client'
import { useAuth } from './AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getDiscountedPrice } from '../utils/filters'
import {
  getDeliveryFee,
  getAmountForFreeDelivery,
  FREE_DELIVERY_THRESHOLD,
} from '../utils/formatters'

const CartContext = createContext(null)

function mapServerCart(data) {
  return (data.items || []).map((item) => ({
    ...item.product,
    id: getProductId(item.product),
    quantity: item.quantity,
  }))
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [guestItems, setGuestItems] = useLocalStorage('freshharvest-cart', [])
  const [serverItems, setServerItems] = useState([])
  const [serverTotals, setServerTotals] = useState(null)
  const [notification, setNotification] = useState('')

  const items = user ? serverItems : guestItems

  const refreshServerCart = useCallback(async () => {
    if (!user) return
    const data = await api('/api/cart')
    setServerItems(mapServerCart(data))
    setServerTotals(data)
  }, [user])

  useEffect(() => {
    if (!user) {
      setServerItems([])
      setServerTotals(null)
      return
    }

    async function syncCart() {
      const local = JSON.parse(window.localStorage.getItem('freshharvest-cart') || '[]')
      for (const item of local) {
        try {
          await api('/api/cart/items', {
            method: 'POST',
            body: { productId: getProductId(item), quantity: item.quantity || 1 },
          })
        } catch {
          /* skip items that cannot merge */
        }
      }
      if (local.length) {
        window.localStorage.setItem('freshharvest-cart', '[]')
        setGuestItems([])
      }
      await refreshServerCart()
    }

    syncCart()
  }, [user, refreshServerCart, setGuestItems])

  useEffect(() => {
    if (!notification) return undefined
    const timeoutId = window.setTimeout(() => setNotification(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [notification])

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (user) {
      await api('/api/cart/items', {
        method: 'POST',
        body: { productId: getProductId(product), quantity },
      })
      await refreshServerCart()
      setNotification(`${product.name} added to cart`)
      return
    }
    const id = getProductId(product)
    setGuestItems((prev) => {
      const existing = prev.find((item) => String(getProductId(item)) === String(id))
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock)
        return prev.map((item) =>
          String(getProductId(item)) === String(id) ? { ...item, quantity: newQty } : item
        )
      }
      return [...prev, { ...product, id, quantity: Math.min(quantity, product.stock) }]
    })
    setNotification(`${product.name} added to cart`)
  }, [user, refreshServerCart, setGuestItems])

  const removeFromCart = useCallback(async (productId) => {
    if (user) {
      await api(`/api/cart/items/${productId}`, { method: 'DELETE' })
      await refreshServerCart()
      return
    }
    setGuestItems((prev) => prev.filter((item) => String(getProductId(item)) !== String(productId)))
  }, [user, refreshServerCart, setGuestItems])

  const increaseQuantity = useCallback(async (productId) => {
    const item = items.find((row) => String(getProductId(row)) === String(productId))
    if (!item) return
    if (user) {
      await api(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        body: { quantity: item.quantity + 1 },
      })
      await refreshServerCart()
      return
    }
    setGuestItems((prev) =>
      prev.map((row) =>
        String(getProductId(row)) === String(productId)
          ? { ...row, quantity: Math.min(row.quantity + 1, row.stock) }
          : row
      )
    )
  }, [items, user, refreshServerCart, setGuestItems])

  const decreaseQuantity = useCallback(async (productId) => {
    const item = items.find((row) => String(getProductId(row)) === String(productId))
    if (!item || item.quantity <= 1) return
    if (user) {
      await api(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        body: { quantity: item.quantity - 1 },
      })
      await refreshServerCart()
      return
    }
    setGuestItems((prev) =>
      prev.map((row) =>
        String(getProductId(row)) === String(productId)
          ? { ...row, quantity: Math.max(row.quantity - 1, 1) }
          : row
      )
    )
  }, [items, user, refreshServerCart, setGuestItems])

  const clearCart = useCallback(async () => {
    if (user) {
      await api('/api/cart', { method: 'DELETE' })
      await refreshServerCart()
      return
    }
    setGuestItems([])
  }, [user, refreshServerCart, setGuestItems])

  const getItemPrice = useCallback((item) => getDiscountedPrice(item), [])

  const subtotal = useMemo(() => {
    if (user && serverTotals) return serverTotals.subtotal
    return items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  }, [user, serverTotals, items, getItemPrice])

  const deliveryFee = useMemo(() => {
    if (user && serverTotals) return serverTotals.deliveryFee
    return getDeliveryFee(subtotal)
  }, [user, serverTotals, subtotal])

  const total = useMemo(() => {
    if (user && serverTotals) return serverTotals.total
    return subtotal + deliveryFee
  }, [user, serverTotals, subtotal, deliveryFee])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      subtotal,
      deliveryFee,
      total,
      itemCount,
      notification,
      dismissNotification: () => setNotification(''),
      amountForFreeDelivery: getAmountForFreeDelivery(subtotal),
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      getItemPrice,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      subtotal,
      deliveryFee,
      total,
      itemCount,
      notification,
      getItemPrice,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
