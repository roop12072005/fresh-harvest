const statuses = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered']

const statusColors = {
  Placed: 'bg-blue-50 text-blue-700 ring-blue-200',
  Confirmed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Preparing: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Out for Delivery': 'bg-orange-50 text-orange-700 ring-orange-200',
  Delivered: 'bg-primary-50 text-primary-700 ring-primary-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  Refunded: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
}

export default function OrderStatus({ status, compact = false }) {
  if (compact) {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusColors[status] || statusColors.Placed}`}
      >
        {status}
      </span>
    )
  }

  const currentIndex = statuses.indexOf(status)

  return (
    <div className="w-full">
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        {statuses.map((step, index) => (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className={`h-0.5 flex-1 ${index <= currentIndex ? 'bg-primary-600' : 'bg-neutral-200'}`}
                />
              )}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  index <= currentIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {index < currentIndex ? '✓' : index + 1}
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${index < currentIndex ? 'bg-primary-600' : 'bg-neutral-200'}`}
                />
              )}
            </div>
            <p
              className={`mt-2 text-center text-xs font-medium ${
                index <= currentIndex ? 'text-primary-700' : 'text-neutral-400'
              }`}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {currentIndex + 1}
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{status}</p>
            <p className="text-sm text-neutral-500">
              Step {currentIndex + 1} of {statuses.length}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / statuses.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
