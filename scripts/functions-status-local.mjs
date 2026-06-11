import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const defaultHealthUrl = "http://127.0.0.1:54321/functions/v1/resume-generate";
const healthUrl = process.env.SUPABASE_FUNCTIONS_HEALTH_URL ?? defaultHealthUrl;
const pidFile = ".cache/supabase-functions-local.pid";

const pid = await readPid(pidFile);
const pidAlive = pid ? isProcessAlive(pid) : false;
const matchingPids = getMatchingFunctionServePids();
const health = await checkHealth(healthUrl);

console.log(`[functions] health url: ${healthUrl}`);
console.log(
  `[functions] endpoint: ${health.ok ? "ok" : "unreachable"}${
    health.status ? ` (${health.status})` : ""
  }`,
);
console.log(
  `[functions] pidfile: ${pid ? `${pid} (${pidAlive ? "alive" : "stale"})` : "missing"}`,
);
console.log(
  `[functions] matching processes: ${
    matchingPids.length > 0 ? matchingPids.join(", ") : "none"
  }`,
);

if (!health.ok) {
  process.exitCode = 1;
}

async function readPid(path) {
  try {
    const text = await readFile(path, "utf8");
    const pid = Number(text.trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getMatchingFunctionServePids() {
  const result = spawnSync("pgrep", ["-f", "supabase.*functions serve"], {
    encoding: "utf8",
  });

  if (result.status !== 0 && result.status !== 1) {
    return [];
  }

  return result.stdout
    .split(/\s+/)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .filter((value) => value !== process.pid);
}

async function checkHealth(url) {
  try {
    const response = await fetch(url, { method: "OPTIONS" });
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error,
    };
  }
}
