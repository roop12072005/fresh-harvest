import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getProductId } from '../api/client'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { getDiscountedPrice } from '../utils/filters'
import { formatPrice } from '../utils/formatters'
import Rating from '../components/ui/Rating'
import Badge from '../components/ui/Badge'
import QuantitySelector from '../components/ui/QuantitySelector'
import Button from '../components/ui/Button'
import ProductGrid from '../components/product/ProductGrid'
import EmptyState from '../components/ui/EmptyState'

export default function ProductDetails() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    Promise.all([
      api(`/api/products/${productId}`),
      api(`/api/products/${productId}/related`).catch(() => []),
      api(`/api/products/${productId}/reviews`).catch(() => []),
    ])
      .then(([item, related, reviewList]) => {
        if (cancelled) return
        setProduct(item)
        setRelatedProducts(related)
        setReviews(reviewList)
        setQuantity(1)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (loading) {
    return <div className="container-app py-16 text-center text-neutral-500">Loading product...</div>
  }

  if (notFound || !product) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          actionLabel="Browse Products"
          actionTo="/products"
        />
      </div>
    )
  }

  const discountedPrice = getDiscountedPrice(product)
  const inWishlist = isInWishlist(getProductId(product))

  return (
    <div className="container-app py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-2xl bg-neutral-50">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {product.organic && <Badge variant="organic">Organic</Badge>}
            {product.discount > 0 && <Badge variant="discount">{product.discount}% OFF</Badge>}
            {product.stock <= 10 && product.stock > 0 && (
              <Badge variant="stock">Only {product.stock} left</Badge>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900">{product.name}</h1>
          <div className="mt-3">
            <Rating value={product.rating} reviewCount={product.reviewCount} size="lg" />
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900">{formatPrice(discountedPrice)}</span>
            {product.discount > 0 && (
              <span className="text-lg text-neutral-400 line-through">{formatPrice(product.price)}</span>
            )}
            <span className="text-neutral-500">/ {product.unit}</span>
          </div>
          <p className="mt-5 leading-relaxed text-neutral-600">{product.description}</p>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Origin:</dt>
              <dd className="text-neutral-500">{product.origin}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Availability:</dt>
              <dd className={product.stock > 0 ? 'text-primary-600' : 'text-red-600'}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => Math.min(q + 1, product.stock))}
              onDecrease={() => setQuantity((q) => Math.max(q - 1, 1))}
              max={product.stock}
            />
            <Button size="lg" onClick={() => addToCart(product, quantity)} disabled={product.stock === 0}>
              Add to Cart
            </Button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:text-red-500"
            >
              <svg className={`h-6 w-6 ${inWishlist ? 'fill-red-500 text-red-500' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-neutral-900">Customer Reviews</h2>
        <div className="mt-6 space-y-4">
          {reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-neutral-800">{review.author}</p>
                <Rating value={review.rating} />
              </div>
              <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
              {review.imageUrl && <img src={review.imageUrl} alt="Customer review" className="mt-3 max-h-48 rounded-lg object-cover" />}
            </div>
          ))}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-neutral-900">Related Products</h2>
          <div className="mt-6">
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      )}
    </div>
  )
}
