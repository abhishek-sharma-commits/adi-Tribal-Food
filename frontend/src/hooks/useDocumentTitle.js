import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} | Adi Food`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
