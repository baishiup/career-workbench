import type { ReactNode } from "react";
import { Button, Chip, Tabs } from "@heroui/react";
import {
  Code2,
  FolderGit2,
  GraduationCap,
  Pencil,
  Target,
  UserRound,
} from "lucide-react";

import {
  pillTabClassName,
  pillTabIndicatorClassName,
  pillTabListClassName,
} from "@/components/workbench/surface-classes";
import { drawerOrder, sectionMeta } from "@/pages/profile/data";
import type { ProfileIcon } from "@/pages/profile/types";
import type { ProfileDraft, ProfileSectionId } from "@career-workbench/domain";

function ProfileDisplay({
  onEdit,
  profile,
}: {
  onEdit: (section: ProfileSectionId) => void;
  profile: ProfileDraft;
}) {
  const fullName =
    `${profile.personal.firstName} ${profile.personal.lastName}`.trim();

  return (
    <div className="flex min-w-0 flex-col">
      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
            <p className="mt-1 text-sm font-medium text-slate-500">
              {profile.personal.headline || "还没有填写职业标题"}
            </p>
            <PersonalFieldGrid profile={profile} />
          </div>
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.preferences.description}
          icon={Target}
          id="profile-preferences"
          onEdit={() => onEdit("preferences")}
          title={sectionMeta.preferences.label}
        >
          <PreferencesFieldGrid profile={profile} />
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.education.description}
          icon={GraduationCap}
          id="profile-education"
          onEdit={() => onEdit("education")}
          title={sectionMeta.education.label}
        >
          {profile.education.length > 0 ? (
            <TimelineList>
              {profile.education.map((item) => (
                <TimelineItem
                  key={item.id}
                  date={formatDateRange(item.startDate, item.endDate)}
                >
                  <h3 className="text-base font-semibold">
                    {item.school || "未填写学校"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {[item.degree, item.major].filter(Boolean).join(" / ") ||
                      "学历和专业未填写"}
                  </p>
                  {item.location ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {item.location}
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                </TimelineItem>
              ))}
            </TimelineList>
          ) : (
            <EmptySection
              actionLabel="添加教育经历"
              description="添加学校、学历、专业和时间范围后，简历生成会有更稳定的教育背景。"
              onAction={() => onEdit("education")}
              title="还没有教育经历"
            />
          )}
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.work.description}
          icon={sectionMeta.work.icon}
          id="profile-work"
          onEdit={() => onEdit("work")}
          title={sectionMeta.work.label}
        >
          {profile.work.length > 0 ? (
            <TimelineList>
              {profile.work.map((item) => (
                <TimelineItem
                  key={item.id}
                  date={formatDateRange(
                    item.startDate,
                    item.current ? "至今" : item.endDate,
                  )}
                >
                  <h3 className="text-base font-semibold">
                    {item.company || "未填写公司"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title || "未填写职位"}
                  </p>
                  {item.summary ? (
                    <p className="mt-2 max-w-4xl text-sm leading-5">
                      {item.summary}
                    </p>
                  ) : null}
                  {item.bullets.filter(Boolean).length > 0 ? (
                    <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm leading-5 text-slate-500">
                      {item.bullets.filter(Boolean).map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </TimelineItem>
              ))}
            </TimelineList>
          ) : (
            <EmptySection
              actionLabel="添加工作经历"
              description="添加公司、职位、职责和可用于简历的成果要点后，匹配和改写会更准确。"
              onAction={() => onEdit("work")}
              title="还没有工作经历"
            />
          )}
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.projects.description}
          icon={FolderGit2}
          id="profile-projects"
          onEdit={() => onEdit("projects")}
          title={sectionMeta.projects.label}
        >
          {profile.projects.length > 0 ? (
            <TimelineList>
              {profile.projects.map((item) => (
                <TimelineItem
                  key={item.id}
                  date={formatDateRange(item.startDate, item.endDate)}
                >
                  <h3 className="text-base font-semibold">
                    {item.name || "未填写项目"}
                  </h3>
                  {item.role ? (
                    <p className="text-sm font-medium text-slate-500">
                      {item.role}
                    </p>
                  ) : null}
                  {item.summary ? (
                    <p className="mt-2 max-w-4xl text-sm leading-5">
                      {item.summary}
                    </p>
                  ) : null}
                  {item.bullets.filter(Boolean).length > 0 ? (
                    <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm leading-5 text-slate-500">
                      {item.bullets.filter(Boolean).map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {item.technologies.filter(Boolean).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.technologies.filter(Boolean).map((tech) => (
                        <Chip key={tech} size="sm" variant="secondary">
                          {tech}
                        </Chip>
                      ))}
                    </div>
                  ) : null}
                </TimelineItem>
              ))}
            </TimelineList>
          ) : (
            <EmptySection
              actionLabel="添加项目经历"
              description="添加代表项目、角色、技术栈和成果要点后，简历会有更立体的项目背景。"
              onAction={() => onEdit("projects")}
              title="还没有项目经历"
            />
          )}
        </ProfileSectionBlock>

        <ProfileSectionBlock
          description={sectionMeta.skills.description}
          icon={Code2}
          id="profile-skills"
          onEdit={() => onEdit("skills")}
          title={sectionMeta.skills.label}
        >
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Chip key={skill} size="sm" variant="secondary">
                  {skill}
                </Chip>
              ))}
            </div>
          ) : (
            <EmptySection
              actionLabel="添加技能标签"
              description="添加技术栈、工具和能力关键词，后续岗位匹配会优先引用这些标签。"
              onAction={() => onEdit("skills")}
              title="还没有技能标签"
            />
          )}
        </ProfileSectionBlock>
      </div>
    </div>
  );
}

function ProfileSectionTabs({
  activeSection,
  onSectionChange,
}: {
  activeSection: ProfileSectionId;
  onSectionChange: (section: ProfileSectionId) => void;
}) {
  return (
    <nav className="shrink-0 bg-slate-100 py-2">
      <Tabs
        onSelectionChange={(key) => {
          const section = String(key) as ProfileSectionId;
          onSectionChange(section);
          document
            .getElementById(`profile-${section}`)
            ?.scrollIntoView({ block: "start" });
        }}
        selectedKey={activeSection}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="资料分区" className={pillTabListClassName}>
            {drawerOrder.map((section) => {
              const Icon = sectionMeta[section].icon;

              return (
                <Tabs.Tab
                  className={pillTabClassName}
                  id={section}
                  key={section}
                >
                  {activeSection === section ? (
                    <Icon aria-hidden="true" className="size-4" />
                  ) : null}
                  <span>{sectionMeta[section].label}</span>
                  <Tabs.Indicator className={pillTabIndicatorClassName} />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
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
    <section className="scroll-mt-4 px-5 py-7" id={id}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <Button
          aria-label={`编辑${title}`}
          isIconOnly
          onPress={onEdit}
          size="sm"
          type="button"
          variant="tertiary"
        >
          <Pencil className="size-4" />
        </Button>
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
    ...customFields,
  ];

  return (
    <div className="mt-5 grid gap-3 rounded-xl bg-slate-100/50 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <PersonalField
          key={field.label}
          label={field.label}
          value={field.value}
        />
      ))}
    </div>
  );
}

function PreferencesFieldGrid({ profile }: { profile: ProfileDraft }) {
  const fields = [
    { label: "求职方向", value: profile.preferences.jobFunction },
    { label: "工作类型", value: profile.preferences.jobTypes.join(", ") },
    {
      label: "接受远程",
      value: profile.preferences.openToRemote ? "是" : "否",
    },
    { label: "期望城市", value: profile.preferences.targetCity },
    { label: "薪资期望", value: profile.preferences.salaryExpectation },
  ];

  return (
    <div className="grid gap-3 rounded-xl bg-slate-100/50 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <PersonalField
          key={field.label}
          label={field.label}
          value={field.value}
        />
      ))}
    </div>
  );
}

function PersonalField({ label, value }: { label: string; value: string }) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="min-w-0 rounded-lg bg-white px-3 py-2">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div
        className={`mt-1 truncate font-medium ${
          hasValue ? "text-slate-700" : "text-slate-500"
        }`}
      >
        {hasValue ? value : "未填写"}
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
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 sm:items-start">
        <span className="mt-1 size-3 shrink-0 rounded-full border-2 border-slate-900 bg-white" />
        <span>{date}</span>
      </div>
      <div className="border-l border-sky-200 pl-4">{children}</div>
    </article>
  );
}

function EmptySection({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-100/35 px-4 py-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
        {description}
      </p>
      <div className="mt-4">
        <Button onPress={onAction} size="sm" type="button" variant="outline">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate && endDate) {
    return `${startDate} -> ${endDate}`;
  }

  if (startDate) {
    return `${startDate} -> 未填写`;
  }

  if (endDate) {
    return `未填写 -> ${endDate}`;
  }

  return "时间未填写";
}

export { ProfileDisplay, ProfileSectionTabs };
