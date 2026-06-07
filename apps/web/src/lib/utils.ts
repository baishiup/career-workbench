import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn helper: clsx handles conditional classes, twMerge removes
// conflicting Tailwind utilities so composed component variants stay predictable.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
