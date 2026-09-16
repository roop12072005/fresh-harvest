import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import SearchBar from '../ui/SearchBar'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products?category=fruits', label: 'Fruits' },
  { to: '/products?category=vegetables', label: 'Vegetables' },
  { to: '/products?featured=true', label: 'Best Sellers' },
  { to: '/products?deals=true', label: 'Offers' },
]

function NavItem({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const defaultAddress = user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0]
  const locationLabel = defaultAddress
    ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.postalCode}`
    : 'No address saved'

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
      <div className="container-app">
        <div className="flex h-16 items-center gap-4 lg:h-[72px] lg:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <span className="hidden text-lg font-bold text-neutral-900 sm:block">
              Fresh<span className="text-primary-600">Harvest</span>
            </span>
          </Link>

          <div className="hidden flex-1 md:block">
            <SearchBar
              onQueryChange={(q) => navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')}
            />
          </div>

          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 lg:ml-0"
            aria-label="Delivery location"
          >
            <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden lg:inline">
              <span className="block text-xs text-neutral-400">Deliver to</span>
              <span className={`block max-w-48 truncate font-medium ${defaultAddress ? 'text-neutral-800' : 'text-neutral-500'}`} title={locationLabel}>{locationLabel}</span>
            </span>
          </button>

          <Link
            to={user ? '/profile' : '/login'}
            className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50 sm:flex"
            aria-label={user ? 'Account' : 'Login'}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          {!user && (
            <Link
              to="/register"
              className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 sm:flex"
              aria-label="Register"
            >
              Register
            </Link>
          )}

          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-50"
            aria-label={`Cart with ${itemCount} items`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-50 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <nav className="hidden border-t border-neutral-100 py-2 md:block">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavItem key={link.label} {...link} />
            ))}
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white md:hidden">
          <div className="container-app space-y-4 py-4">
            <SearchBar
              onQueryChange={(q) => navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')}
              onSearch={(q) => { closeMobile(); navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products') }}
            />
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavItem key={link.label} {...link} onClick={closeMobile} />
              ))}
              <NavItem to={user ? '/profile' : '/login'} label={user ? 'Account' : 'Sign in'} onClick={closeMobile} />
              {!user && <NavItem to="/register" label="Register" onClick={closeMobile} />}
              <NavItem to="/orders" label="My Orders" onClick={closeMobile} />
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
