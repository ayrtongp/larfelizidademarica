import { useEffect, useState } from "react";

export function useIsMobile(initial?: boolean, breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(!!initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px), (pointer: coarse)`);
    const apply = () => setIsMobile(mql.matches);
    apply();
    if (mql.addEventListener) mql.addEventListener("change", apply);
    else (mql as any).addListener(apply);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", apply);
      else (mql as any).removeListener(apply);
    };
  }, [breakpoint]);

  return isMobile;
}
