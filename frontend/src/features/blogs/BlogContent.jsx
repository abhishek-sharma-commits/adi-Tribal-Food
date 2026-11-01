import { useMemo } from 'react';
import { sanitizeRichText } from '../../utils/richText.js';

export default function BlogContent({ html }) {
  const clean = useMemo(() => sanitizeRichText(html), [html]);
  return (
    <div
      className="prose prose-lg prose-neutral max-w-none prose-headings:tracking-tight prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-img:rounded-card"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
