import { emptyProfile } from "@/pages/profile/data";
import { getSupabaseClient } from "@/lib/supabase";
import type { ProfileDraft } from "@career-workbench/domain";

type ProfileDataRow = {
  profile_data: unknown | null;
};

type UserDataRow = {
  email: string | null;
  full_name: string | null;
};

type StoredProfileDraft = Partial<
  Omit<ProfileDraft, "personal" | "preferences">
> & {
  personal?: Partial<ProfileDraft["personal"]>;
  preferences?: Partial<ProfileDraft["preferences"]>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeProfileData(value: unknown): ProfileDraft {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return emptyProfile;
  }

  const profile = value as StoredProfileDraft;
  const personal = profile.personal ?? {};
  const preferences = profile.preferences ?? {};

  return {
    ...emptyProfile,
    ...profile,
    personal: {
      ...emptyProfile.personal,
      ...personal,
      customFields: Array.isArray(personal.customFields)
        ? personal.customFields
        : [],
    },
    preferences: {
      ...emptyProfile.preferences,
      ...preferences,
      jobTypes: Array.isArray(preferences.jobTypes)
        ? preferences.jobTypes
        : [],
      workAuthorization: Array.isArray(preferences.workAuthorization)
        ? preferences.workAuthorization
        : [],
    },
    education: Array.isArray(profile.education) ? profile.education : [],
    work: Array.isArray(profile.work) ? profile.work : [],
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
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

  if (
    !nextProfile.personal.firstName &&
    !nextProfile.personal.lastName &&
    row.full_name
  ) {
    const [firstName, ...lastNameParts] = row.full_name.trim().split(/\s+/);
    nextProfile.personal.firstName = firstName ?? "";
    nextProfile.personal.lastName = lastNameParts.join(" ");
  }

  return nextProfile;
}

async function fetchProfileFromSupabase(userId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 环境变量未配置完整。");
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
    throw new Error("Supabase 环境变量未配置完整。");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      profile_data: profile,
      source: "manual",
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
