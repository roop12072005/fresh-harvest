export function toProductDto(product) {
  const obj = product.toObject ? product.toObject({ virtuals: true }) : product
  const category = obj.categoryId
  const categorySlug =
    category && typeof category === 'object' ? category.slug : obj.categorySlug
  const categoryName =
    category && typeof category === 'object' ? category.name : undefined
  const discountPercent = obj.discountPercent || 0
  const salePrice =
    obj.salePrice ?? Math.round(obj.price * (1 - discountPercent / 100))

  return {
    id: obj._id,
    _id: obj._id,
    legacyId: obj.legacyId,
    name: obj.name,
    slug: obj.slug,
    category: categorySlug,
    categoryName,
    categoryId: category && typeof category === 'object' ? category._id : category,
    description: obj.description,
    price: obj.price,
    discount: discountPercent,
    discountPercent,
    unit: obj.unit,
    image: obj.imageUrl,
    imageUrl: obj.imageUrl,
    organic: obj.organic,
    stock: obj.stockQuantity,
    stockQuantity: obj.stockQuantity,
    lowStockThreshold: obj.lowStockThreshold,
    origin: obj.origin,
    featured: obj.featured,
    active: obj.active,
    rating: obj.ratingSummary?.average ?? 0,
    reviewCount: obj.ratingSummary?.count ?? 0,
    ratingSummary: obj.ratingSummary,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    salePrice,
  }
}

export function toCategoryDto(category) {
  const obj = category.toObject ? category.toObject() : category
  return {
    id: obj._id,
    _id: obj._id,
    name: obj.name,
    slug: obj.slug,
    image: obj.imageUrl,
    imageUrl: obj.imageUrl,
    description: obj.description,
    active: obj.active,
    displayOrder: obj.displayOrder,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  }
}
