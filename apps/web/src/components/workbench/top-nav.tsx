"use client";

import { useState } from "react";
import { Button, Tabs } from "@heroui/react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut } from "lucide-react";

import Link from "@/components/router-link";
import type { WorkbenchNavItem } from "@/components/workbench/nav-items";
import {
  pillTabClassName,
  pillTabIndicatorClassName,
  pillTabListClassName,
} from "@/components/workbench/surface-classes";
import type { AuthProfile } from "@/lib/auth-store";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo, usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";

function TopNav({ items }: { items: WorkbenchNavItem[] }) {
  const pathname = usePathname();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const fallbackItem = items[0];
  const activeValue =
    items.find((item) => {
      if (!item.href) {
        return false;
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })?.value ?? fallbackItem?.value;

  return (
    <div className="sticky top-0 z-20 bg-slate-100">
      <div className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark />
        </div>

        <nav className="col-span-2 row-start-2 flex min-w-0 justify-start overflow-x-auto sm:col-span-1 sm:row-start-auto sm:justify-center sm:overflow-visible">
          {activeValue ? (
            <Tabs
              onSelectionChange={(key) => {
                const item = items.find((entry) => entry.value === String(key));

                if (item && item.href !== pathname) {
                  navigateTo(item.href);
                }
              }}
              selectedKey={activeValue}
            >
              <Tabs.ListContainer>
                <Tabs.List
                  aria-label="工作台导航"
                  className={pillTabListClassName}
                >
                  {items.map((item) => {
                    const Icon =
                      activeValue === item.value ? item.activeIcon : item.icon;

                    return (
                      <Tabs.Tab
                        className={pillTabClassName}
                        id={item.value}
                        key={item.value}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        <span>{item.label}</span>
                        <Tabs.Indicator className={pillTabIndicatorClassName} />
                      </Tabs.Tab>
                    );
                  })}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          ) : null}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <Button
              aria-expanded={isUserMenuOpen}
              className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium leading-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
              onPress={() => setIsUserMenuOpen((open) => !open)}
              type="button"
              variant="tertiary"
            >
              <UserAvatar profile={profile} user={user} />
              <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                {getUserDisplayName(user, profile)}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 transition-transform",
                  isUserMenuOpen ? "rotate-180" : "",
                )}
              />
            </Button>

            {isUserMenuOpen ? (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                <Button
                  className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
                  onPress={() => {
                    setIsUserMenuOpen(false);
                    void signOut();
                  }}
                  type="button"
                  variant="tertiary"
                >
                  <LogOut className="size-4" />
                  退出登录
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getUserDisplayName(user: User | null, profile: AuthProfile | null) {
  if (profile?.fullName) {
    return profile.fullName;
  }

  if (profile?.email) {
    return profile.email.split("@")[0] ?? profile.email;
  }

  if (!user) {
    return "未登录";
  }

  const metadata = user.user_metadata;
  const name = metadata.full_name ?? metadata.name;

  if (typeof name === "string" && name.trim().length > 0) {
    return name;
  }

  if (user.email) {
    return user.email.split("@")[0] ?? user.email;
  }

  return "用户";
}

function getUserAvatarUrl(user: User | null) {
  if (!user) {
    return null;
  }

  const metadata = user.user_metadata;
  const avatarUrl = metadata.avatar_url ?? metadata.picture;

  return typeof avatarUrl === "string" && avatarUrl.trim().length > 0
    ? avatarUrl
    : null;
}

function UserAvatar({
  profile,
  user,
}: {
  profile: AuthProfile | null;
  user: User | null;
}) {
  const avatarUrl = profile?.avatarUrl ?? getUserAvatarUrl(user);
  const displayName = getUserDisplayName(user, profile);

  if (avatarUrl) {
    return (
      <img
        alt=""
        className="size-6 rounded-full object-cover"
        referrerPolicy="no-referrer"
        src={avatarUrl}
      />
    );
  }

  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-blue-600">
      {displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

function BrandMark() {
  return (
    <Link
      aria-label="返回首页"
      className="flex items-center gap-1.5 rounded-md text-2xl transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
      href="/"
    >
      <div
        aria-hidden="true"
        className="flex items-center text-lg font-bold tracking-tight"
      >
        <span>Career</span>
        <span className="text-blue-600">.</span>
      </div>
    </Link>
  );
}

export { TopNav };
