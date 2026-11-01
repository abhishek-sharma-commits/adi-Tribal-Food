import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';

export default function FeaturedBlog({ blog }) {
  return (
    <Link to={`/blogs/${blog.slug}`} className="group grid gap-6 md:grid-cols-2 md:items-center md:gap-10">
      <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-surface">
        {blog.coverImageUrl ? (
          <img src={blog.coverImageUrl} alt={blog.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted" aria-hidden="true">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Featured story{blog.category?.name ? ` · ${blog.category.name}` : ''}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{blog.title}</h2>
        {blog.excerpt && <p className="mt-3 text-lg text-ink-muted">{blog.excerpt}</p>}
        <p className="mt-4 text-sm text-ink-muted">{[blog.author?.fullName, formatDate(blog.publishedAt)].filter(Boolean).join(' · ')}</p>
      </div>
    </Link>
  );
}
