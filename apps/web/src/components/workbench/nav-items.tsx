import { Bot, BriefcaseBusiness, FileText, UserRound } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import type { PillTabItem } from "@/components/workbench/pill-tabs";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

type WorkbenchNavItem = PillTabItem<string> & {
  activeIcon: NavIcon;
  href: string;
  icon: NavIcon;
};

const workbenchNavItems: WorkbenchNavItem[] = [
  {
    activeIcon: BriefcaseSolidIcon,
    href: "/jobs",
    icon: BriefcaseBusiness,
    label: "职位",
    value: "/jobs",
  },
  {
    activeIcon: FileSolidIcon,
    href: "/resumes",
    icon: FileText,
    label: "简历",
    value: "/resumes",
  },
  {
    activeIcon: UserSolidIcon,
    href: "/profile",
    icon: UserRound,
    label: "资料",
    value: "/profile",
  },
  {
    activeIcon: AiSolidIcon,
    href: "/ai-chat",
    icon: Bot,
    label: "AI",
    value: "/ai-chat",
  },
];

function BriefcaseSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9 4.75A2.75 2.75 0 0 1 11.75 2h.5A2.75 2.75 0 0 1 15 4.75V6h3.25A2.75 2.75 0 0 1 21 8.75v1.8a30.7 30.7 0 0 1-8.3 1.18h-1.4A30.7 30.7 0 0 1 3 10.55v-1.8A2.75 2.75 0 0 1 5.75 6H9V4.75Zm1.75 0V6h2.5V4.75c0-.41-.34-.75-.75-.75h-1c-.41 0-.75.34-.75.75Z"
        fill="currentColor"
      />
      <path
        d="M12.7 13.23a32.2 32.2 0 0 0 8.3-1.1v4.62A2.75 2.75 0 0 1 18.25 19.5H5.75A2.75 2.75 0 0 1 3 16.75v-4.62a32.2 32.2 0 0 0 8.3 1.1h1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FileSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6.75 3A2.75 2.75 0 0 0 4 5.75v12.5A2.75 2.75 0 0 0 6.75 21h10.5A2.75 2.75 0 0 0 20 18.25V9.5h-4.25A3.25 3.25 0 0 1 12.5 6.25V3H6.75Zm1.5 10h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5Zm0 3h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Z"
        fill="currentColor"
      />
      <path
        d="M14 3.38v2.87c0 .97.78 1.75 1.75 1.75h3.88A2.8 2.8 0 0 0 19 7.12l-3.88-3.88A2.8 2.8 0 0 0 14 3.38Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UserSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 12.25a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5Z"
        fill="currentColor"
      />
      <path
        d="M4 19.05c0-3.28 3.58-5.8 8-5.8s8 2.52 8 5.8c0 1.21-.98 2.2-2.2 2.2H6.2A2.2 2.2 0 0 1 4 19.05Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AiSolidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8.5 4.5A3.5 3.5 0 0 1 12 1a3.5 3.5 0 0 1 3.5 3.5V6h1.75A3.75 3.75 0 0 1 21 9.75v6A3.75 3.75 0 0 1 17.25 19.5H6.75A3.75 3.75 0 0 1 3 15.75v-6A3.75 3.75 0 0 1 6.75 6H8.5V4.5Zm1.75 0V6h3.5V4.5a1.75 1.75 0 1 0-3.5 0Z"
        fill="currentColor"
      />
      <path
        d="M7.25 21.25h9.5a.75.75 0 0 0 0-1.5h-9.5a.75.75 0 0 0 0 1.5Z"
        fill="currentColor"
      />
      <path
        d="M8.25 11.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm7.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm-4.5 3.25a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z"
        fill="white"
        opacity=".82"
      />
    </svg>
  );
}

export { workbenchNavItems };
