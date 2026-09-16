import { Link } from 'react-router-dom'
import Button from './Button'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo = '/products',
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {actionLabel && (
        <div className="mt-6">
          {onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : (
            <Link to={actionTo}>
              <Button>{actionLabel}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
