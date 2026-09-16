import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-white sm:text-xl">{category.name}</h3>
        <p className="mt-1 text-sm text-white/80 line-clamp-2">{category.description}</p>
      </div>
    </Link>
  )
}
