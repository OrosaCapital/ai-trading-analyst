import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
    const mql = window.matchMedia(query);

    const update = (e?: MediaQueryListEvent) => {
      const nextValue = e ? e.matches : mql.matches;
      setIsMobile((prev) => (prev === nextValue ? prev : nextValue));
    };

    update();
    mql.addEventListener("change", update);

    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
