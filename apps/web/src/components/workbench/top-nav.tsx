"use client";

import { ChevronDown } from "lucide-react";

import { PillTabs, type PillTabItem } from "@/components/ui/pill-tabs";
import { usePathname } from "@/lib/router";

function TopNav({ items }: { items: Array<PillTabItem<string>> }) {
  const pathname = usePathname();
  const fallbackItem = items[0];
  const activeValue =
    items.find((item) => {
      if (!item.href) {
        return false;
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })?.value ?? fallbackItem?.value;

  return (
    <div className="sticky top-0 z-20 bg-background">
      <div className="grid min-h-14 grid-cols-1 items-center gap-3 px-3 py-2 lg:grid-cols-[1fr_auto_1fr] lg:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark />
        </div>

        <nav className="flex justify-start lg:justify-center">
          {activeValue ? (
            <PillTabs activeValue={activeValue} items={items} />
          ) : null}
        </nav>

        <div className="flex items-center justify-start gap-2 lg:justify-end">
          <div className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium leading-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
              洪
            </span>
            <span className="hidden text-sm font-medium sm:inline">洪远麒</span>
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-1.5 text-2xl">
      <div
        aria-hidden="true"
        className="hidden items-center text-lg font-bold tracking-tight sm:flex"
      >
        <span>Career</span>
        <span className="text-primary">.</span>
      </div>
    </div>
  );
}

export { TopNav };
