export type SupabaseRuntime = "browser" | "edge-function" | "server";

export type StorageBucketName = "resume-files" | "resume-exports";

export const storageBuckets: Record<StorageBucketName, StorageBucketName> = {
  "resume-files": "resume-files",
  "resume-exports": "resume-exports",
};

export function describeDbBoundary(runtime: SupabaseRuntime) {
  return {
    runtime,
    note: "Supabase clients and repositories will be added here after Auth, RLS, and env naming are finalized. Dify ids are stored only as external run references; Supabase remains the canonical product data store.",
  };
}
