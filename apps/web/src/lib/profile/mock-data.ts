import { emptyProfile } from "@/lib/profile/empty-profile";
import type { ProfileDraft } from "@career-workbench/domain";

// 本地开发 fixture：无 Supabase env 时规则匹配分的降级 Profile，
// 技能与 lib/jobs/mock-data.ts 的职位有部分重叠，方便演示不同分数。
const mockProfile: ProfileDraft = {
  ...emptyProfile,
  personal: {
    ...emptyProfile.personal,
    firstName: "Demo",
    lastName: "User",
    headline: "Senior Frontend Engineer",
    city: "Remote",
  },
  preferences: {
    ...emptyProfile.preferences,
    jobFunction: "Frontend Engineer",
    jobTypes: ["全职"],
    openToRemote: true,
  },
  work: [
    {
      id: "mock-work-1",
      company: "Acme SaaS",
      title: "Senior Frontend Engineer",
      location: "Remote",
      jobType: "全职",
      startDate: "2021-03",
      endDate: "",
      current: true,
      summary: "负责 B2B 工作台前端架构、组件库和增长实验。",
      bullets: [],
    },
    {
      id: "mock-work-2",
      company: "Beta Studio",
      title: "Frontend Engineer",
      location: "Shanghai",
      jobType: "全职",
      startDate: "2018-07",
      endDate: "2021-02",
      current: false,
      summary: "开发营销站点和数据可视化面板。",
      bullets: [],
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Node.js",
    "Design System",
    "Tailwind CSS",
  ],
};

export { mockProfile };
