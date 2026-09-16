import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { formatPrice } from '../utils/formatters'

function Icon({ children, className = 'h-5 w-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{children}</svg>
}

export default function Profile() {
  const { user, logout, refresh } = useAuth()
  const { items, itemCount, subtotal, getItemPrice } = useCart()
  const [activePanel, setActivePanel] = useState('overview')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  })

  if (!user) return <Navigate to="/login" replace state={{ from: '/profile' }} />

  const defaultAddress = user.addresses?.find((item) => item.isDefault) || user.addresses?.[0]

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      fullName: user.name,
      phone: user.phone,
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    })
  }

  const handleAddressSubmit = async (event) => {
    event.preventDefault()
    setAddressSubmitting(true)
    setAddressError('')
    try {
      await api('/api/profile/addresses', { method: 'POST', body: addressForm })
      await refresh()
      setShowAddressForm(false)
      resetAddressForm()
    } catch (error) {
      setAddressError(error.message)
    } finally {
      setAddressSubmitting(false)
    }
  }

  const setDefaultAddress = async (address) => {
    setAddressError('')
    try {
      await api(`/api/profile/addresses/${address._id}`, {
        method: 'PATCH',
        body: { ...address, isDefault: true },
      })
      await refresh()
    } catch (error) {
      setAddressError(error.message)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Icon><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></Icon> },
    { id: 'addresses', label: 'Addresses', icon: <Icon><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" /><circle cx="12" cy="10" r="2.5" /></Icon> },
    { id: 'cart', label: 'Cart', count: itemCount, icon: <Icon><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></Icon> },
  ]

  const inputClass = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-primary-500 focus:bg-white'

  return (
    <div className="min-h-screen bg-neutral-50/70">
      <div className="container-app py-8 lg:py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 px-6 py-8 text-white shadow-lg sm:px-10 lg:px-12">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-32 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-primary-700 shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-primary-100">Welcome back</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="mt-1 text-sm text-primary-100">{user.email}</p>
              </div>
            </div>
            <Link to="/products" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25 sm:self-center">
              Shop fresh produce
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link to="/orders" className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon><path d="M6 3h12v18H6z" /><path d="M9 7h6M9 11h6M9 15h3" /></Icon></span>
              <span className="text-neutral-300">→</span>
            </div>
            <p className="mt-4 text-sm text-neutral-500">Your orders</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">Track purchases</p>
          </Link>
          <button type="button" onClick={() => setActivePanel('addresses')} className="rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><Icon><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" /><circle cx="12" cy="10" r="2.5" /></Icon></span>
              <span className="text-neutral-300">→</span>
            </div>
            <p className="mt-4 text-sm text-neutral-500">Delivery address</p>
            <p className="mt-1 truncate text-lg font-bold text-neutral-900">{defaultAddress ? defaultAddress.city : 'Add an address'}</p>
          </button>
          <button type="button" onClick={() => setActivePanel('cart')} className="rounded-2xl border border-neutral-100 bg-white p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Icon><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></Icon></span>
              <span className="text-neutral-300">→</span>
            </div>
            <p className="mt-4 text-sm text-neutral-500">Shopping cart</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">{itemCount} item{itemCount === 1 ? '' : 's'} · {formatPrice(subtotal)}</p>
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-2xl border border-neutral-100 bg-white p-2 shadow-[var(--shadow-card)]">
            <p className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Account</p>
            {navItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setActivePanel(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${activePanel === item.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{item.count}</span>}
              </button>
            ))}
            <div className="my-2 border-t border-neutral-100" />
            <Link to="/cart" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              <Icon><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></Icon>
              View cart
            </Link>
            <button type="button" onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
              <Icon><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 00-2-2h-6" /></Icon>
              Log out
            </button>
          </aside>

          <main className="min-w-0">
            {activePanel === 'overview' && (
              <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <p className="text-sm font-semibold text-primary-600">Account overview</p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900">Everything in one place</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Manage your personal details, delivery addresses, orders, and favourite products from your FreshHarvest account.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-neutral-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Email</p><p className="mt-2 break-all font-medium text-neutral-800">{user.email}</p></div>
                  <div className="rounded-xl bg-neutral-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Phone</p><p className="mt-2 font-medium text-neutral-800">{user.phone}</p></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/orders"><Button>View my orders</Button></Link>
                  <Link to="/products"><Button variant="secondary">Continue shopping</Button></Link>
                </div>
              </section>
            )}

            {activePanel === 'cart' && (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary-600">Ready when you are</p><h2 className="mt-1 text-2xl font-bold">Your cart</h2></div><Link to="/cart"><Button variant="secondary">Open full cart</Button></Link></div>
                {items.length === 0 ? <EmptyState title="Your cart is empty" description="Add fresh fruits and vegetables to your cart to see them here." actionLabel="Browse Products" actionTo="/products" /> : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id || item._id} className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[var(--shadow-card)]">
                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1"><p className="truncate font-semibold text-neutral-900">{item.name}</p><p className="mt-1 text-sm text-neutral-500">Quantity: {item.quantity}</p></div>
                        <p className="font-semibold text-neutral-900">{formatPrice(getItemPrice(item) * item.quantity)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-2xl bg-primary-50 p-5"><span className="font-semibold text-neutral-800">Cart subtotal</span><span className="text-lg font-bold text-primary-700">{formatPrice(subtotal)}</span></div>
                  </div>
                )}
              </section>
            )}

            {activePanel === 'addresses' && (
              <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-sm font-semibold text-primary-600">Delivery preferences</p><h2 className="mt-1 text-2xl font-bold">Saved addresses</h2><p className="mt-2 text-sm text-neutral-500">Choose a default address for faster checkout.</p></div>
                  <Button onClick={() => { setShowAddressForm(!showAddressForm); setAddressError('') }}>{showAddressForm ? 'Cancel' : '+ Add address'}</Button>
                </div>
                {addressError && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{addressError}</p>}
                {showAddressForm && (
                  <form onSubmit={handleAddressSubmit} className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/40 p-5">
                    <h3 className="font-semibold">Add a new address</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <select value={addressForm.label} onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))} className={inputClass}><option>Home</option><option>Work</option><option>Other</option></select>
                      {['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'].map((field) => <input key={field} required value={addressForm[field]} onChange={(event) => setAddressForm((prev) => ({ ...prev, [field]: event.target.value }))} placeholder={{ fullName: 'Full name', phone: 'Phone number', addressLine1: 'Street address', city: 'City', state: 'State', postalCode: 'Postal code' }[field]} className={`${inputClass} ${field === 'addressLine1' ? 'sm:col-span-2' : ''}`} />)}
                    </div>
                    <label className="mt-4 flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))} /> Make this my default address</label>
                    <Button type="submit" disabled={addressSubmitting} className="mt-5">{addressSubmitting ? 'Saving...' : 'Save address'}</Button>
                  </form>
                )}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {user.addresses?.length ? user.addresses.map((address) => (
                    <div key={address._id} className={`rounded-2xl border p-5 ${address.isDefault ? 'border-primary-300 bg-primary-50/50' : 'border-neutral-200'}`}>
                      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-neutral-900">{address.label || 'Address'}</h3>{address.isDefault && <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">Default</span>}</div>
                      <address className="mt-4 block not-italic text-sm leading-6 text-neutral-500">{address.fullName}<br />{address.addressLine1}<br />{address.city}, {address.state} {address.postalCode}<br />{address.phone}</address>
                      {!address.isDefault && <button type="button" onClick={() => setDefaultAddress(address)} className="mt-4 text-sm font-semibold text-primary-700 hover:text-primary-800">Set as default</button>}
                    </div>
                  )) : <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center sm:col-span-2"><p className="font-medium text-neutral-800">No saved addresses yet</p><p className="mt-1 text-sm text-neutral-500">Add one to speed up your next checkout.</p></div>}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {confirmLogout && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" role="presentation">
        <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 id="logout-title" className="text-xl font-bold text-neutral-900">Log out of FreshHarvest?</h2>
          <p className="mt-2 text-sm text-neutral-500">Your saved cart and wishlist will remain available when you sign in again.</p>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setConfirmLogout(false)}>Stay signed in</Button><Button variant="danger" onClick={logout}>Log out</Button></div>
        </div>
      </div>}
    </div>
  )
}
