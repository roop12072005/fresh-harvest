import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import ProductGrid from '../components/product/ProductGrid'
import FilterSidebar from '../components/product/FilterSidebar'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [maxPrice, setMaxPrice] = useState(500)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    organic: false,
    inStock: false,
    deals: searchParams.get('deals') === 'true',
    featured: searchParams.get('featured') === 'true',
  })

  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || 'all',
      deals: searchParams.get('deals') === 'true',
      featured: searchParams.get('featured') === 'true',
    }))
  }, [searchParams])

  useEffect(() => {
    api('/api/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category && filters.category !== 'all') params.set('category', filters.category)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.minRating) params.set('minRating', filters.minRating)
    if (filters.organic) params.set('organic', 'true')
    if (filters.inStock) params.set('inStock', 'true')
    if (filters.deals) params.set('deals', 'true')
    if (filters.featured) params.set('featured', 'true')
    params.set('sort', sortBy)
    params.set('limit', '24')

    setLoading(true)
    api(`/api/products?${params.toString()}`)
      .then((data) => {
        setFilteredProducts(data.items || [])
        setTotal(data.pagination?.total || 0)
        const highest = Math.max(...(data.items || []).map((item) => item.price), 500)
        setMaxPrice(highest)
      })
      .catch(() => {
        setFilteredProducts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [filters, sortBy])

  const handleCategoryChange = (category) => {
    setFilters((prev) => ({ ...prev, category }))
    const params = new URLSearchParams(searchParams)
    if (category === 'all') params.delete('category')
    else params.set('category', category)
    setSearchParams(params)
  }

  const pageTitle = filters.deals
    ? "Today's Deals"
    : filters.featured
      ? 'Best Sellers'
      : filters.category !== 'all'
        ? categories.find((c) => c.slug === filters.category)?.name || 'Products'
        : 'All Products'

  return (
    <div className="container-app py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{pageTitle}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{pageTitle}</h1>
          <p className="mt-1 text-neutral-500">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 lg:hidden"
          >
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <SearchBar
          defaultValue={filters.search}
          onQueryChange={(q) => {
            setFilters((prev) => ({ ...prev, search: q }))
            const params = new URLSearchParams(searchParams)
            if (q) params.set('search', q)
            else params.delete('search')
            setSearchParams(params)
          }}
          onSearch={(q) => {
            setFilters((prev) => ({ ...prev, search: q }))
            const params = new URLSearchParams(searchParams)
            if (q) params.set('search', q)
            else params.delete('search')
            setSearchParams(params)
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filters.category === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug || cat.id}
            type="button"
            onClick={() => handleCategoryChange(cat.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filters.category === cat.slug
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            maxPrice={maxPrice}
          />
        </div>

        <div>
          {loading ? (
            <p className="py-16 text-center text-neutral-500">Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              actionLabel="Clear Filters"
              onAction={() => {
                setFilters({
                  search: '',
                  category: 'all',
                  minPrice: '',
                  maxPrice: '',
                  minRating: '',
                  organic: false,
                  inStock: false,
                  deals: false,
                  featured: false,
                })
                setSearchParams({})
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
