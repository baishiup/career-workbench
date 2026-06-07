import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "antd";
import {
  Code2,
  GraduationCap,
  Pencil,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PillTabs } from "@/components/ui/pill-tabs";
import { drawerOrder, sectionMeta } from "@/features/profile/data";
import type { ProfileIcon, ProfileSection } from "@/features/profile/types";
import type { ProfileDraft } from "@career-workbench/resume";

function ProfileDisplay({
  onEdit,
  profile,
}: {
  onEdit: (section: ProfileSection) => void;
  profile: ProfileDraft;
}) {
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("personal");
  const fullName =
    `${profile.personal.firstName} ${profile.personal.lastName}`.trim();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="pb-1 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">资料</h1>
      </div>
      <ProfileSectionTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <ProfileSectionBlock
          description={sectionMeta.personal.description}
          icon={UserRound}
          id="profile-personal"
          onEdit={() => onEdit("personal")}
          title={sectionMeta.personal.label}
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {fullName || "未命名资料"}
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {profile.personal.headline}
            </p>
            <PersonalFieldGrid profile={profile} />
          </div>
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.education.description}
          icon={GraduationCap}
          id="profile-education"
          onEdit={() => onEdit("education")}
          title={sectionMeta.education.label}
        >
          <TimelineList>
            {profile.education.map((item) => (
              <TimelineItem
                key={item.id}
                date={`${item.startDate} -> ${item.endDate}`}
              >
                <h3 className="text-base font-semibold">{item.school}</h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {[item.degree, item.major].filter(Boolean).join(" / ")}
                </p>
                {item.location ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.location}
                  </p>
                ) : null}
                {item.description ? (
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </TimelineItem>
            ))}
          </TimelineList>
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.work.description}
          icon={sectionMeta.work.icon}
          id="profile-work"
          onEdit={() => onEdit("work")}
          title={sectionMeta.work.label}
        >
          <TimelineList>
            {profile.work.map((item) => (
              <TimelineItem
                key={item.id}
                date={`${item.startDate} -> ${item.current ? "至今" : item.endDate}`}
              >
                <h3 className="text-base font-semibold">{item.company}</h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-2 max-w-4xl text-sm leading-5">
                  {item.summary}
                </p>
                <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm leading-5 text-muted-foreground">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </TimelineItem>
            ))}
          </TimelineList>
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.skills.description}
          icon={Code2}
          id="profile-skills"
          onEdit={() => onEdit("skills")}
          title={sectionMeta.skills.label}
        >
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge
                className="h-7 rounded-lg bg-muted px-2.5 text-sm text-secondary-foreground"
                key={skill}
                variant="secondary"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </ProfileSectionBlock>
      </div>
    </div>
  );
}

function ProfileSectionTabs({
  activeSection,
  onSectionChange,
}: {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}) {
  return (
    <nav className="sticky top-14 z-10 bg-background py-2">
      <PillTabs
        activeValue={activeSection}
        items={drawerOrder.map((section) => ({
          activeIcon: sectionMeta[section].icon,
          href: `#profile-${section}`,
          label: sectionMeta[section].label,
          value: section,
        }))}
        onValueChange={onSectionChange}
      />
    </nav>
  );
}

function ProfileSectionBlock({
  children,
  description,
  icon: Icon,
  id,
  onEdit,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ProfileIcon;
  id: string;
  onEdit: () => void;
  title: string;
}) {
  return (
    <section className="px-5 py-7" id={id}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          aria-label={`编辑${title}`}
          icon={<Pencil />}
          onClick={onEdit}
          size="small"
          type="text"
        />
      </div>
      {children}
    </section>
  );
}

function PersonalFieldGrid({ profile }: { profile: ProfileDraft }) {
  const customFields = (profile.personal.customFields ?? []).map((field) => ({
    label: field.label || "自定义字段",
    value: field.value,
  }));
  const fields = [
    { label: "名", value: profile.personal.firstName },
    { label: "姓", value: profile.personal.lastName },
    { label: "职业标题", value: profile.personal.headline },
    { label: "邮箱", value: profile.personal.email },
    { label: "电话", value: profile.personal.phone },
    { label: "城市", value: profile.personal.city },
    { label: "LinkedIn 链接", value: profile.personal.linkedin },
    { label: "GitHub 链接", value: profile.personal.github },
    { label: "求职方向", value: profile.preferences.jobFunction },
    { label: "工作类型", value: profile.preferences.jobTypes.join(", ") },
    ...customFields,
  ];

  return (
    <div className="mt-5 grid gap-3 rounded-xl bg-muted/50 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <PersonalField key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  );
}

function PersonalField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-card px-3 py-2">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium text-secondary-foreground">
        {value || "未填写"}
      </div>
    </div>
  );
}

function TimelineList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

function TimelineItem({
  children,
  date,
}: {
  children: ReactNode;
  date: string;
}) {
  return (
    <article className="grid gap-3 sm:grid-cols-[136px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sm:items-start">
        <span className="mt-1 size-3 shrink-0 rounded-full border-2 border-foreground bg-card" />
        <span>{date}</span>
      </div>
      <div className="border-l border-accent pl-4">{children}</div>
    </article>
  );
}

export { ProfileDisplay };
