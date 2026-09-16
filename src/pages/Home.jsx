import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getProductId } from '../api/client'
import Button from '../components/ui/Button'
import CategoryCard from '../components/product/CategoryCard'
import ProductGrid from '../components/product/ProductGrid'

const benefits = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Farm Fresh',
    description: 'Sourced directly from local farms every morning for peak freshness.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Fast Delivery',
    description: 'Same-day delivery in 2–4 hours. Your produce arrives when you need it.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Quality Guaranteed',
    description: 'Every item is hand-checked. Not satisfied? Full refund, no questions asked.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'Secure Payment',
    description: 'UPI, cards, or cash on delivery. Your payment data is always protected.',
  },
]

const whyChooseUs = [
  { title: 'Fresh Sourcing', description: 'We partner with 50+ local farms to bring you produce picked at the perfect ripeness.' },
  { title: 'Quality Checking', description: 'Every order passes through a 3-step quality check before it leaves our facility.' },
  { title: 'Fast Delivery', description: 'Temperature-controlled delivery ensures your fruits and veggies stay fresh in transit.' },
  { title: 'Easy Returns', description: 'Received something you\'re not happy with? Request a refund within 24 hours of delivery.' },
]

export default function Home() {
  const [categories, setCategories] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [dealProducts, setDealProducts] = useState([])

  useEffect(() => {
    api('/api/categories').then(setCategories).catch(() => setCategories([]))
    api('/api/products?featured=true&limit=8').then((data) => setPopularProducts(data.items || [])).catch(() => setPopularProducts([]))
    api('/api/products?deals=true&limit=4').then((data) => setDealProducts(data.items || [])).catch(() => setDealProducts([]))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-white">
        <div className="container-app py-12 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                🌿 100% Fresh Guarantee
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Fresh From Farm to{' '}
                <span className="text-primary-600">Your Door</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-500">
                Order the freshest fruits and vegetables online. Hand-picked from local farms,
                delivered to your doorstep within hours. Eat healthy, live better.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products?category=fruits">
                  <Button size="lg">Shop Fruits</Button>
                </Link>
                <Link to="/products?category=vegetables">
                  <Button size="lg" variant="secondary">Shop Vegetables</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <img
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=500&fit=crop"
                  alt="Fresh colorful fruits"
                  className="rounded-2xl object-cover shadow-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=500&fit=crop"
                  alt="Fresh vegetables"
                  className="mt-8 rounded-2xl object-cover shadow-lg"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-white px-4 py-3 shadow-lg sm:-bottom-6 sm:-left-6">
                <p className="text-2xl font-bold text-primary-600">2hr</p>
                <p className="text-sm text-neutral-500">Avg. Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-neutral-100 bg-white py-12">
        <div className="container-app">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4 rounded-xl p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">{benefit.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-16 lg:py-20">
        <div className="container-app">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900">Shop By Category</h2>
            <p className="mt-2 text-neutral-500">Browse our wide selection of fresh produce</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug || category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="bg-neutral-50 py-16 lg:py-20">
        <div className="container-app">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">Popular Products</h2>
              <p className="mt-2 text-neutral-500">Customer favorites this week</p>
            </div>
            <Link to="/products?featured=true" className="hidden text-sm font-medium text-primary-600 hover:text-primary-700 sm:block">
              View All →
            </Link>
          </div>
          <div className="mt-10">
            <ProductGrid products={popularProducts} />
          </div>
        </div>
      </section>

      {/* Today's Deals */}
      <section className="py-16 lg:py-20">
        <div className="container-app">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary-700 to-primary-600 p-8 lg:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-white">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                  Limited Time
                </span>
                <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Today&apos;s Deals</h2>
                <p className="mt-2 max-w-md text-primary-100">
                  Save big on hand-picked produce. Fresh deals updated daily — grab them before they&apos;re gone!
                </p>
                <Link to="/products?deals=true" className="mt-6 inline-block">
                  <Button variant="secondary" size="lg">View All Deals</Button>
                </Link>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 lg:max-w-xl">
                {dealProducts.map((product) => (
                  <Link
                    key={getProductId(product)}
                    to={`/products/${getProductId(product)}`}
                    className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <img src={product.image} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs text-primary-200">{product.discount}% OFF</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-50 py-16 lg:py-20">
        <div className="container-app">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900">Why Choose FreshHarvest?</h2>
            <p className="mt-2 text-neutral-500">We&apos;re committed to bringing you the best produce experience</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-neutral-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
