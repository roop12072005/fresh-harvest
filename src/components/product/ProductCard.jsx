import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductId } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { getDiscountedPrice } from '../../utils/filters'
import { formatPrice } from '../../utils/formatters'
import Rating from '../ui/Rating'
import Badge from '../ui/Badge'
import QuantitySelector from '../ui/QuantitySelector'
import Button from '../ui/Button'

export default function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const discountedPrice = getDiscountedPrice(product)
  const inWishlist = isInWishlist(getProductId(product))

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setQuantity(1)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <Link to={`/products/${getProductId(product)}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discount > 0 && (
            <Badge variant="discount">{product.discount}% OFF</Badge>
          )}
          {product.organic && <Badge variant="organic">Organic</Badge>}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur-sm transition-colors hover:text-red-500"
        >
          <svg
            className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'fill-none'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/products/${getProductId(product)}`} className="group/link">
          <h3 className="font-semibold text-neutral-800 transition-colors group-hover/link:text-primary-700">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.description}</p>

        <div className="mt-2">
          <Rating value={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-neutral-900">
            {formatPrice(discountedPrice)}
          </span>
          {product.discount > 0 && (
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
          <span className="text-sm text-neutral-500">/ {product.unit}</span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => setQuantity((q) => Math.min(q + 1, product.stock))}
            onDecrease={() => setQuantity((q) => Math.max(q - 1, 1))}
            max={product.stock}
            size="sm"
          />
          <Button
            size="sm"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </article>
  )
}
