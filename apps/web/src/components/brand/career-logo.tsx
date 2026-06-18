import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CareerLogoSize = "sm" | "md" | "lg";

type CareerLogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: CareerLogoSize;
};

const sizeClassName: Record<CareerLogoSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-[40px]",
};

function CareerLogo({ className, size = "md", ...props }: CareerLogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center font-bold leading-none tracking-tight text-slate-950",
        sizeClassName[size],
        className,
      )}
      {...props}
    >
      <span className="text-blue-600">C</span>
      <span>a</span>
      <span>r</span>
      <span>e</span>
      <span>e</span>
      <span>r</span>
      <span className="text-blue-600">.</span>
    </div>
  );
}

export { CareerLogo };
