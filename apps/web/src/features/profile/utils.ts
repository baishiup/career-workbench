import type { ProfileDraft } from "@career-workbench/resume";

function getCompletion(profile: ProfileDraft) {
  const fields = [
    profile.personal.firstName,
    profile.personal.lastName,
    profile.personal.email,
    profile.personal.phone,
    profile.personal.city,
    profile.preferences.jobFunction,
    profile.preferences.jobTypes.length > 0 ? "jobTypes" : "",
    profile.education.length > 0 ? "education" : "",
    profile.work.length > 0 ? "work" : "",
    profile.skills.length >= 6 ? "skills" : "",
    profile.personal.github || profile.personal.linkedin,
    profile.personal.customFields.some((field) => field.label && field.value)
      ? "customFields"
      : "",
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { createId, getCompletion };
