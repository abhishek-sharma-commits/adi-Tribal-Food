import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShareButton from '../../components/ShareButton.jsx';
import { formatDate } from '../../utils/format.js';
import { readingMinutes } from '../../utils/richText.js';
import BlogCard from './BlogCard.jsx';
import BlogContent from './BlogContent.jsx';

export default function BlogView({ blog, related = [], showShare = true }) {
  return (
    <article className="container-page py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-muted">
          <Link to="/blogs" className="hover:text-ink hover:underline">
            Stories
          </Link>
          {blog.category && (
            <>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <Link to={`/blogs?category=${blog.category.slug}`} className="hover:text-ink hover:underline">
                {blog.category.name}
              </Link>
            </>
          )}
        </nav>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{blog.title}</h1>
        {blog.excerpt && <p className="mt-3 text-lg text-ink-muted">{blog.excerpt}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          <p className="text-sm text-ink-muted">
            {blog.author?.fullName && <span className="font-semibold text-ink">{blog.author.fullName}</span>}
            {blog.author?.fullName && ' · '}
            {formatDate(blog.publishedAt)} · {readingMinutes(blog.content)} min read
          </p>
          {showShare && <ShareButton title={blog.title} />}
        </div>
      </div>

      {blog.coverImageUrl && <img src={blog.coverImageUrl} alt={blog.title} className="mx-auto mt-8 aspect-[16/9] w-full max-w-5xl rounded-3xl bg-surface object-cover" />}

      <div className="mx-auto mt-10 max-w-3xl">
        <BlogContent html={blog.content} />

        {blog.tags?.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
            {blog.tags.map((t) => (
              <li key={t}>
                <Link to={`/blogs?tag=${encodeURIComponent(t)}`} className="chip">
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-stories" className="mt-16 border-t border-line pt-10">
          <h2 id="related-stories" className="text-2xl font-bold tracking-tight">
            Related stories
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
            {related.map((b) => (
              <li key={b._id}>
                <BlogCard blog={b} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
