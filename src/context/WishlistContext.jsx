import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getProductId } from '../api/client'
import { useAuth } from './AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [guestWishlist, setGuestWishlist] = useLocalStorage('freshharvest-wishlist', [])
  const [serverWishlist, setServerWishlist] = useState([])
  const wishlist = user ? serverWishlist : guestWishlist

  const refresh = useCallback(async () => {
    if (!user) return
    const data = await api('/api/wishlist')
    setServerWishlist(data)
  }, [user])

  useEffect(() => {
    if (!user) {
      setServerWishlist([])
      return
    }
    refresh()
  }, [user, refresh])

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => String(getProductId(item)) === String(productId)),
    [wishlist]
  )

  const toggleWishlist = useCallback(async (product) => {
    const id = getProductId(product)
    if (user) {
      if (isInWishlist(id)) {
        await api(`/api/wishlist/${id}`, { method: 'DELETE' })
      } else {
        await api(`/api/wishlist/${id}`, { method: 'POST' })
      }
      await refresh()
      return
    }
    setGuestWishlist((prev) => {
      if (prev.some((item) => String(getProductId(item)) === String(id))) {
        return prev.filter((item) => String(getProductId(item)) !== String(id))
      }
      return [...prev, { ...product, id }]
    })
  }, [user, isInWishlist, refresh, setGuestWishlist])

  const value = useMemo(
    () => ({
      wishlist,
      isInWishlist,
      toggleWishlist,
      addToWishlist: toggleWishlist,
      removeFromWishlist: (productId) =>
        toggleWishlist(wishlist.find((item) => String(getProductId(item)) === String(productId))),
      wishlistCount: wishlist.length,
    }),
    [wishlist, isInWishlist, toggleWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}
