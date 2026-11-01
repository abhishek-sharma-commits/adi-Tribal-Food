export default function RecipeFilters({ categories, category, sort, onCategory, onSort }) {
  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
        <li>
          <button type="button" onClick={() => onCategory('')} aria-pressed={!category} className={pill(!category)}>
            All
          </button>
        </li>
        {categories.map((c) => (
          <li key={c._id}>
            <button type="button" onClick={() => onCategory(c.slug)} aria-pressed={category === c.slug} className={pill(category === c.slug)}>
              {c.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex shrink-0 items-center gap-2">
        <label htmlFor="recipe-sort" className="text-sm text-ink-muted">
          Sort by
        </label>
        <select id="recipe-sort" value={sort} onChange={(e) => onSort(e.target.value)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium focus:border-ink focus:outline-none">
          <option value="newest">Newest</option>
          <option value="featured">Featured</option>
        </select>
      </div>
    </div>
  );
}
