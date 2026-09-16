const variants = {
  organic: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200',
  discount: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  stock: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  default: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
