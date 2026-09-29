import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAsync - runs `load` on mount (and when `deps` change) and tracks data/loading/error.
 * `reload` re-runs it, e.g. for a "Try again" button.
 */
export default function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await loadRef.current();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error?.error || "Something went wrong. Please try again." });
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers control re-runs through deps
  }, deps);

  return { ...state, reload: run };
}
