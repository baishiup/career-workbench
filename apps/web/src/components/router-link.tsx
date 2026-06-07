import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import { navigateTo } from "@/lib/router";

type RouterLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
};

function Link({ children, href, onClick, target, ...props }: RouterLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      target ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      href.startsWith("#") ||
      href.startsWith("http")
    ) {
      return;
    }

    event.preventDefault();
    navigateTo(href);
  }

  return (
    <a href={href} onClick={handleClick} target={target} {...props}>
      {children}
    </a>
  );
}

export default Link;
