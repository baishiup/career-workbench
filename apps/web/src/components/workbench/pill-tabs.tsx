import type { ComponentType, SVGProps } from "react";
import { Button } from "@heroui/react";

import Link from "@/components/router-link";
import { cn } from "@/lib/utils";

type PillTabIcon = ComponentType<SVGProps<SVGSVGElement>>;

type PillTabItem<TValue extends string> = {
  activeIcon?: PillTabIcon;
  href?: string;
  icon?: PillTabIcon;
  label: string;
  value: TValue;
};

function PillTabs<TValue extends string>({
  activeValue,
  items,
  onValueChange,
}: {
  activeValue: TValue;
  items: Array<PillTabItem<TValue>>;
  onValueChange?: (value: TValue) => void;
}) {
  return (
    <div className="-mx-1 -my-3 flex min-w-0 gap-2 px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <PillTab
          activeValue={activeValue}
          item={item}
          key={item.value}
          onValueChange={onValueChange}
        />
      ))}
    </div>
  );
}

function PillTab<TValue extends string>({
  activeValue,
  item,
  onValueChange,
}: {
  activeValue: TValue;
  item: PillTabItem<TValue>;
  onValueChange?: (value: TValue) => void;
}) {
  const isActive = activeValue === item.value;
  const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
  const className = cn(
    "flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-[12px] px-3 text-sm font-semibold leading-5 text-slate-500 transition",
    "hover:bg-slate-100/70 hover:text-slate-900",
    isActive &&
      "bg-white text-blue-600 shadow-[0_4px_14px_rgba(15,23,42,0.08)] hover:bg-white hover:text-blue-600",
  );

  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      <span>{item.label}</span>
    </>
  );

  if (item.href) {
    if (item.href.startsWith("#")) {
      return (
        <a
          aria-current={isActive ? "page" : undefined}
          className={className}
          href={item.href}
          onClick={() => onValueChange?.(item.value)}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={className}
        href={item.href}
        onClick={() => onValueChange?.(item.value)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      className={className}
      onPress={() => onValueChange?.(item.value)}
      type="button"
      variant="tertiary"
    >
      {content}
    </Button>
  );
}

export { PillTabs };
export type { PillTabIcon, PillTabItem };
