import type { ProfileDraft } from "./types.ts";

/**
 * 空 Profile 草稿，是各页面初始化和 normalize 兜底的唯一基准。
 * 应用层和领域层都从这里取，避免重复定义导致字段漂移。
 */
const emptyProfile: ProfileDraft = {
  personal: {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [],
  },
  preferences: {
    jobFunction: "",
    jobTypes: [],
    openToRemote: true,
    targetCity: "",
    salaryExpectation: "",
    customFields: [],
  },
  education: [],
  work: [],
  projects: [],
  skills: [],
  custom: [],
};

export { emptyProfile };
