import { Search } from 'lucide-react';
import { useState } from 'react';

/** Pill-shaped search field. Calls onSearch with the trimmed query. */
export default function SearchPill({ onSearch, placeholder = 'Search recipes or ingredients', autoFocus = false, className = '', initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  const submit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };
  return (
    <form onSubmit={submit} role="search" className={`flex items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-pill ${className}`}>
      <label htmlFor="search-pill" className="sr-only">
        {placeholder}
      </label>
      <input
        id="search-pill"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark" aria-label="Search">
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
