import { useEffect, useState } from "react";

// Delays reflecting `value` by `delay`ms — used to debounce admin search/
// filter inputs so filtering (and any derived useMemo) only recomputes
// once typing pauses, instead of on every keystroke.
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
