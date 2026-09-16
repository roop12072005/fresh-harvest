import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ defaultValue = '', compact = false, onSearch, onQueryChange }) {
  const [query, setQuery] = useState(defaultValue)
  const navigate = useNavigate()

  const handleChange = (value) => {
    setQuery(value)
    onQueryChange?.(value.trim())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (onSearch) {
      onSearch(trimmed)
    } else if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/products')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${compact ? 'w-full' : 'w-full max-w-xl'}`}>
      <label htmlFor="search" className="sr-only">
        Search products
      </label>
      <input
        id="search"
        type="search"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search fruits, vegetables..."
        className={`w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none ${compact ? '' : 'sm:text-base'}`}
      />
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  )
}
