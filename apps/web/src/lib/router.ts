import { useEffect, useState } from "react";

function currentPathname() {
  return window.location.pathname || "/";
}

function navigateTo(pathname: string, options?: { replace?: boolean }) {
  if (window.location.pathname === pathname) {
    return;
  }

  if (options?.replace) {
    window.history.replaceState(null, "", pathname);
  } else {
    window.history.pushState(null, "", pathname);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePathname() {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    const updatePathname = () => setPathname(currentPathname());

    window.addEventListener("popstate", updatePathname);
    return () => window.removeEventListener("popstate", updatePathname);
  }, []);

  return pathname;
}

export { navigateTo, usePathname };
