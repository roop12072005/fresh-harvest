export default function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}) {
  const btnSize = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-9 h-9'
  const textSize = size === 'sm' ? 'w-8 text-sm' : 'w-10'

  return (
    <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className={`${btnSize} flex items-center justify-center rounded-l-lg text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        −
      </button>
      <span className={`${textSize} text-center font-medium tabular-nums`} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className={`${btnSize} flex items-center justify-center rounded-r-lg text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        +
      </button>
    </div>
  )
}
