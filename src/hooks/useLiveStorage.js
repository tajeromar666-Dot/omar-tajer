import { useCallback, useEffect, useState } from "react";
import { DATA_CHANGE_EVENT } from "../data/seedData";

// Keeps a piece of localStorage-backed data in sync everywhere it's used:
// same-tab changes (admin editing while the public page is mounted) arrive
// via the custom DATA_CHANGE_EVENT, cross-tab changes via the native
// `storage` event. No page reload needed either way.
export default function useLiveStorage(loader) {
  const [data, setData] = useState(loader);

  const refresh = useCallback(() => setData(loader()), [loader]);

  useEffect(() => {
    function onChange() {
      refresh();
    }
    window.addEventListener(DATA_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    // Catch any change that landed between the first render and this
    // subscription (e.g. an async local read finishing first) — effects can
    // run a frame after render, so that event would otherwise be missed.
    refresh();
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return [data, refresh];
}
