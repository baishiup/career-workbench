/**
 * Profile 的 Supabase 读写。
 *
 * Profile 页和职位匹配（规则匹配分）共用，归属 lib/profile。
 */

import { emptyProfile } from "@/lib/profile/empty-profile";
import { getSupabaseClient } from "@/lib/supabase";
import {
  coerceRichText,
  type CustomField,
  type CustomModule,
  type EducationItem,
  mergeTextAndBulletsToRichText,
  type ProfileDraft,
  type ProjectItem,
  type WorkItem,
} from "@career-workbench/domain";

type ProfileDataRow = {
  profile_data: unknown | null;
};

type UserDataRow = {
  email: string | null;
  full_name: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function bool(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function toCustomFields(value: unknown): CustomField[] {
  return (Array.isArray(value) ? value : []).map((field, index) => {
    const record = asRecord(field);

    return {
      id: str(record.id) || `custom-field-${index + 1}`,
      label: str(record.label),
      value: str(record.value),
    };
  });
}

/** 同时兼容旧形态（summary + bullets / location / technologies / 纯文本说明）。 */
function normalizeEducationItem(value: unknown, index: number): EducationItem {
  const record = asRecord(value);

  return {
    current: bool(record.current),
    degree: str(record.degree),
    description: coerceRichText(record.description),
    endDate: str(record.endDate),
    id: str(record.id) || `edu-${index + 1}`,
    major: str(record.major),
    school: str(record.school),
    startDate: str(record.startDate),
  };
}

function normalizeWorkItem(value: unknown, index: number): WorkItem {
  const record = asRecord(value);
  const description =
    "description" in record
      ? coerceRichText(record.description)
      : mergeTextAndBulletsToRichText(
          str(record.summary),
          strArray(record.bullets),
        );

  return {
    company: str(record.company),
    current: bool(record.current),
    description,
    endDate: str(record.endDate),
    id: str(record.id) || `work-${index + 1}`,
    skills: strArray(record.skills),
    startDate: str(record.startDate),
    title: str(record.title),
  };
}

function normalizeProjectItem(value: unknown, index: number): ProjectItem {
  const record = asRecord(value);
  const description =
    "description" in record
      ? coerceRichText(record.description)
      : mergeTextAndBulletsToRichText(
          str(record.summary),
          strArray(record.bullets),
        );
  const skills = Array.isArray(record.skills)
    ? strArray(record.skills)
    : strArray(record.technologies);

  return {
    current: bool(record.current),
    description,
    endDate: str(record.endDate),
    id: str(record.id) || `project-${index + 1}`,
    name: str(record.name),
    role: str(record.role),
    skills,
    startDate: str(record.startDate),
  };
}

function normalizeCustomModule(value: unknown, index: number): CustomModule {
  const record = asRecord(value);

  return {
    content: coerceRichText(record.content),
    id: str(record.id) || `custom-${index + 1}`,
    name: str(record.name),
  };
}

function normalizeProfileData(value: unknown): ProfileDraft {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return emptyProfile;
  }

  const personal = asRecord(value.personal);
  const preferences = asRecord(value.preferences);

  return {
    personal: {
      ...emptyProfile.personal,
      city: str(personal.city) || emptyProfile.personal.city,
      customFields: toCustomFields(personal.customFields),
      email: str(personal.email),
      fullName: str(personal.fullName),
      github: str(personal.github),
      headline: str(personal.headline),
      linkedin: str(personal.linkedin),
      phone: str(personal.phone),
      portfolio: str(personal.portfolio),
    },
    preferences: {
      customFields: toCustomFields(preferences.customFields),
      jobFunction: str(preferences.jobFunction),
      jobTypes: strArray(preferences.jobTypes),
      openToRemote:
        typeof preferences.openToRemote === "boolean"
          ? preferences.openToRemote
          : emptyProfile.preferences.openToRemote,
      salaryExpectation: str(preferences.salaryExpectation),
      targetCity: str(preferences.targetCity),
    },
    education: (Array.isArray(value.education) ? value.education : []).map(
      normalizeEducationItem,
    ),
    work: (Array.isArray(value.work) ? value.work : []).map(normalizeWorkItem),
    projects: (Array.isArray(value.projects) ? value.projects : []).map(
      normalizeProjectItem,
    ),
    skills: strArray(value.skills),
    custom: (Array.isArray(value.custom) ? value.custom : []).map(
      normalizeCustomModule,
    ),
  };
}

function applyProfileRowFallback(
  profile: ProfileDraft,
  row: UserDataRow | null,
): ProfileDraft {
  if (!row) {
    return profile;
  }

  const nextProfile = {
    ...profile,
    personal: { ...profile.personal },
  };

  if (!nextProfile.personal.email && row.email) {
    nextProfile.personal.email = row.email;
  }

  if (!nextProfile.personal.fullName && row.full_name) {
    nextProfile.personal.fullName = row.full_name.trim();
  }

  return nextProfile;
}

async function fetchProfileFromSupabase(userId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("数据服务未连接，无法读取资料。");
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("email,full_name")
    .eq("id", userId)
    .maybeSingle<UserDataRow>();

  if (userError) {
    throw userError;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", userId)
    .maybeSingle<ProfileDataRow>();

  if (profileError) {
    throw profileError;
  }

  return applyProfileRowFallback(
    normalizeProfileData(profileRow?.profile_data),
    userRow ?? null,
  );
}

async function saveProfileToSupabase(userId: string, profile: ProfileDraft) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("数据服务未连接，无法保存资料。");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      profile_data: profile,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export { fetchProfileFromSupabase, saveProfileToSupabase };
