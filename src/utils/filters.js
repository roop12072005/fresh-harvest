export function filterProducts(products, filters) {
  let result = [...products]

  if (filters.search) {
    const query = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    )
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter(
      (p) => p.category.toLowerCase() === filters.category.toLowerCase()
    )
  }

  if (filters.organic) {
    result = result.filter((p) => p.organic)
  }

  if (filters.inStock) {
    result = result.filter((p) => p.stock > 0)
  }

  if (filters.minPrice) {
    result = result.filter((p) => getDiscountedPrice(p) >= Number(filters.minPrice))
  }

  if (filters.maxPrice) {
    result = result.filter((p) => getDiscountedPrice(p) <= Number(filters.maxPrice))
  }

  if (filters.minRating) {
    result = result.filter((p) => p.rating >= Number(filters.minRating))
  }

  if (filters.deals) {
    result = result.filter((p) => p.discount > 0)
  }

  if (filters.featured) {
    result = result.filter((p) => p.featured)
  }

  return result
}

export function sortProducts(products, sortBy) {
  const sorted = [...products]

  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b))
    case 'price-high':
      return sorted.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a))
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id)
    case 'featured':
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
}

export function getDiscountedPrice(product) {
  if (!product.discount) return product.price
  return Math.round(product.price * (1 - product.discount / 100))
}
