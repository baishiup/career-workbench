import type { ProfileDraft } from "./types";

/**
 * Profile 是否具备运行匹配分析的最低条件：技能和工作经历都为空视为
 * 「无 Profile」，调用方应展示引导完善 Profile 的空状态，而不是触发分析。
 */
function hasMatchableProfile(
  profile: ProfileDraft | null | undefined,
): profile is ProfileDraft {
  if (!profile) {
    return false;
  }

  return profile.skills.length > 0 || profile.work.length > 0;
}

export { hasMatchableProfile };
