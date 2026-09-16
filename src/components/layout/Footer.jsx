import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

const footerLinks = {
  shop: [
    { to: '/products', label: 'All Products' },
    { to: '/products?category=fruits', label: 'Fruits' },
    { to: '/products?category=vegetables', label: 'Vegetables' },
    { to: '/products?deals=true', label: 'Today\'s Deals' },
  ],
  support: [
    { to: '#', label: 'Help Center' },
    { to: '#', label: 'Track Order' },
    { to: '#', label: 'Returns & Refunds' },
    { to: '#', label: 'Contact Us' },
  ],
  company: [
    { to: '#', label: 'About Us' },
    { to: '#', label: 'Our Farms' },
    { to: '#', label: 'Careers' },
    { to: '#', label: 'Blog' },
  ],
}

export default function Footer() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    api('/api/categories').then(setCategories).catch(() => setCategories([]))
  }, [])
  return (
    <footer className="border-t border-neutral-100 bg-neutral-50">
      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-neutral-900">
                Fresh<span className="text-primary-600">Harvest</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
              Your trusted online destination for farm-fresh fruits and vegetables.
              Quality produce delivered to your doorstep within hours.
            </p>
            <div className="mt-6 flex gap-3">
              {['twitter', 'instagram', 'facebook'].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  <span className="text-xs font-semibold uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800">Shop</h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-neutral-500 transition-colors hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800">Categories</h4>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.slug || cat.id}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="text-sm text-neutral-500 transition-colors hover:text-primary-600"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800">Support</h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.to} className="text-sm text-neutral-500 transition-colors hover:text-primary-600">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-neutral-800">Contact</h4>
              <p className="mt-2 text-sm text-neutral-500">support@freshharvest.in</p>
              <p className="text-sm text-neutral-500">+91 1800-123-4567</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} FreshHarvest. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-neutral-400">
            <a href="#" className="hover:text-neutral-600">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
