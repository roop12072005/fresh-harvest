import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider, useCart } from './context/CartContext'
import { useAuth } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminApp from './admin/AdminApp'

function CartNotification() {
  const { notification, dismissNotification } = useCart()

  if (!notification) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-20 z-[60] flex items-center gap-3 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">✓</span>
      <span>{notification}</span>
      <button type="button" onClick={dismissNotification} aria-label="Dismiss notification" className="ml-2 text-lg leading-none text-white/80 hover:text-white">
        ×
      </button>
    </div>
  )
}

function AuthNotification() {
  const { message, dismissMessage } = useAuth()

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-20 z-[60] flex items-center gap-3 rounded-xl bg-primary-700 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">✓</span>
      <span>{message}</span>
      <button type="button" onClick={dismissMessage} aria-label="Dismiss notification" className="ml-2 text-lg leading-none text-white/80 hover:text-white">
        ×
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthNotification />
        <CartProvider>
          <WishlistProvider>
            <CartNotification />
            <Routes>
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:productId" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-success" element={<OrderSuccess />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:orderId" element={<OrderDetails />} />
                <Route path="profile" element={<Profile />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
