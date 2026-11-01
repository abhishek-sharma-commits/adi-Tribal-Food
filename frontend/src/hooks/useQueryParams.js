import { useSearchParams } from 'react-router-dom';

/** URL-backed filter state. `update` resets pagination unless told otherwise; empty values drop the param. */
export function useQueryParams() {
  const [params, setParams] = useSearchParams();
  const update = (patch, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, String(value));
    }
    if (!keepPage) next.delete('page');
    setParams(next);
  };
  const clearAll = () => setParams(new URLSearchParams());
  return { params, update, clearAll };
}
