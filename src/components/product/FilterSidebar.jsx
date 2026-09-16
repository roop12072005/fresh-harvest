export default function FilterSidebar({ filters, onFilterChange, maxPrice }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            aria-label="Minimum price"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            aria-label="Maximum price"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-400">Up to {maxPrice}</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Rating
        </h3>
        <div className="space-y-2">
          {[4, 3, 2].map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="rating"
                checked={Number(filters.minRating) === rating}
                onChange={() => handleChange('minRating', rating)}
                className="accent-primary-600"
              />
              <span className="text-sm text-neutral-700">{rating}+ Stars</span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="rating"
              checked={!filters.minRating}
              onChange={() => handleChange('minRating', '')}
              className="accent-primary-600"
            />
            <span className="text-sm text-neutral-700">All Ratings</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Filters
        </h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filters.organic}
              onChange={(e) => handleChange('organic', e.target.checked)}
              className="h-4 w-4 rounded accent-primary-600"
            />
            <span className="text-sm text-neutral-700">Organic Only</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => handleChange('inStock', e.target.checked)}
              className="h-4 w-4 rounded accent-primary-600"
            />
            <span className="text-sm text-neutral-700">In Stock Only</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onFilterChange({
            ...filters,
            minPrice: '',
            maxPrice: '',
            minRating: '',
            organic: false,
            inStock: false,
          })
        }
        className="w-full rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        Clear Filters
      </button>
    </aside>
  )
}
