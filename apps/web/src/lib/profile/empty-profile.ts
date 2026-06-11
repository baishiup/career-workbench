import type { ProfileDraft } from "@career-workbench/domain";

/** 空 Profile 草稿，是各页面初始化和 normalize 兜底的统一基准。 */
const emptyProfile: ProfileDraft = {
  personal: {
    firstName: "",
    lastName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    targetRegion: "",
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [],
  },
  preferences: {
    jobFunction: "",
    jobTypes: [],
    location: "",
    openToRemote: true,
    workAuthorization: [],
  },
  education: [],
  work: [],
  projects: [],
  skills: [],
};

export { emptyProfile };
