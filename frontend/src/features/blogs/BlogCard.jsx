import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';

export default function BlogCard({ blog }) {
  return (
    <Link to={`/blogs/${blog.slug}`} className="group block">
      <div className="aspect-[16/10] overflow-hidden rounded-card bg-surface">
        {blog.coverImageUrl ? (
          <img src={blog.coverImageUrl} alt={blog.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted" aria-hidden="true">
            <BookOpen className="h-8 w-8" />
          </div>
        )}
      </div>
      {blog.category?.name && <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">{blog.category.name}</p>}
      <h3 className={`${blog.category?.name ? 'mt-0.5' : 'mt-3'} line-clamp-2 font-semibold`}>{blog.title}</h3>
      {blog.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{blog.excerpt}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        {[blog.author?.fullName, formatDate(blog.publishedAt)].filter(Boolean).join(' · ')}
      </p>
    </Link>
  );
}
