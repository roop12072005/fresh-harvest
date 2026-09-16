import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { getProductId } from '../../api/client'
import { formatPrice } from '../../utils/formatters'
import QuantitySelector from '../ui/QuantitySelector'

export default function CartItem({ item }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart, getItemPrice } = useCart()
  const price = getItemPrice(item)
  const lineTotal = price * item.quantity
  const id = getProductId(item)

  return (
    <div className="flex gap-4 rounded-xl border border-neutral-100 bg-white p-4 shadow-[var(--shadow-card)]">
      <Link to={`/products/${id}`} className="shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/products/${item.id}`}
              className="font-semibold text-neutral-800 hover:text-primary-700"
            >
              {item.name}
            </Link>
            <p className="text-sm text-neutral-500">
              {formatPrice(price)} / {item.unit}
            </p>
          </div>
          <p className="shrink-0 font-semibold text-neutral-900">{formatPrice(lineTotal)}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantitySelector
            quantity={item.quantity}
            onIncrease={() => increaseQuantity(id)}
            onDecrease={() => decreaseQuantity(id)}
            max={item.stock}
            size="sm"
          />
          <button
            type="button"
            onClick={() => removeFromCart(id)}
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
