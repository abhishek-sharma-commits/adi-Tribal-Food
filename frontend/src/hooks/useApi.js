import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs `fetcher(signal)` on mount and whenever `deps` change; cancels stale requests. */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current(controller.signal)
      .then((res) => setState({ data: res.data, meta: res.meta ?? null, loading: false, error: null }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ data: null, meta: null, loading: false, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
