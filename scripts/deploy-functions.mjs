import { spawnSync } from "node:child_process";

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();

if (!projectRef) {
  console.error(
    "[functions:deploy] Missing SUPABASE_PROJECT_REF. Example: SUPABASE_PROJECT_REF=your-ref pnpm functions:deploy",
  );
  process.exit(1);
}

const args = [
  "functions",
  "deploy",
  "--project-ref",
  projectRef,
  "--use-api",
  "--import-map",
  "supabase/functions/import_map.json",
  "--no-verify-jwt",
  ...process.argv.slice(2),
];

const result = spawnSync("supabase", args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
