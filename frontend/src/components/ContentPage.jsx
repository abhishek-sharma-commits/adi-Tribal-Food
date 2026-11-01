import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

/** Shared layout for About / policy pages: title, optional "last updated" line, readable prose. */
export default function ContentPage({ title, intro, updated, children }) {
  useDocumentTitle(title);
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-ink-muted">{intro}</p>}
        {updated && <p className="mt-3 text-sm text-ink-muted">Last updated {updated}</p>}
        <div className="prose prose-lg prose-neutral mt-10 max-w-none prose-headings:tracking-tight prose-a:text-brand prose-a:no-underline hover:prose-a:underline">{children}</div>
      </div>
    </div>
  );
}
