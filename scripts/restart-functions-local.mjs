import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

const cacheDir = ".cache";
const pidFile = `${cacheDir}/supabase-functions-local.pid`;
const logFile = `${cacheDir}/supabase-functions-local.log`;
const healthUrl =
  process.env.SUPABASE_FUNCTIONS_HEALTH_URL ??
  "http://127.0.0.1:54321/functions/v1/resume-generate";
const serveCommand = "supabase";
const serveArgs = [
  "functions",
  "serve",
  "--env-file",
  "supabase/.env.local",
  "--import-map",
  "supabase/functions/import_map.json",
  "--no-verify-jwt",
];

mkdirSync(cacheDir, { recursive: true });

try {
  await stopExistingServe();
  const child = startServe();
  await waitForReady(child, 30_000);
  child.unref();
  console.log(`[functions] serving locally: ${healthUrl}`);
  console.log(`[functions] pid: ${child.pid}`);
  console.log(`[functions] log: ${logFile}`);
} catch (error) {
  console.error(
    `[functions] ${error instanceof Error ? error.message : error}`,
  );
  const log = readLastLog();

  if (log) {
    console.error("[functions] recent log:");
    console.error(log);
  }

  process.exit(1);
}

async function stopExistingServe() {
  const pids = new Set([...readPidFile(), ...getMatchingFunctionServePids()]);
  pids.delete(process.pid);

  if (pids.size === 0) {
    return;
  }

  console.log(
    `[functions] stopping existing serve pids: ${[...pids].join(", ")}`,
  );

  for (const pid of pids) {
    killProcess(pid, "SIGTERM");
  }

  await waitForPidsToExit([...pids], 5_000);

  const survivors = [...pids].filter(isProcessAlive);

  if (survivors.length > 0) {
    console.log(`[functions] forcing stale pids: ${survivors.join(", ")}`);
    for (const pid of survivors) {
      killProcess(pid, "SIGKILL");
    }
    await waitForPidsToExit(survivors, 2_000);
  }

  if (existsSync(pidFile)) {
    rmSync(pidFile);
  }
}

function startServe() {
  const stdout = openSync(logFile, "a");
  const stderr = openSync(logFile, "a");
  const child = spawn(serveCommand, serveArgs, {
    cwd: process.cwd(),
    detached: true,
    env: process.env,
    stdio: ["ignore", stdout, stderr],
  });
  closeSync(stdout);
  closeSync(stderr);

  if (!child.pid) {
    throw new Error("failed to start supabase functions serve");
  }

  writeFileSync(pidFile, `${child.pid}\n`);
  return child;
}

async function waitForReady(child, timeoutMs) {
  const startedAt = Date.now();
  let exitInfo = null;

  child.once("exit", (code, signal) => {
    exitInfo = { code, signal };
  });

  while (Date.now() - startedAt < timeoutMs) {
    if (exitInfo) {
      throw new Error(
        `supabase functions serve exited early (${exitInfo.code ?? exitInfo.signal})`,
      );
    }

    const health = await checkHealth();

    if (health.ok && isProcessAlive(child.pid)) {
      return;
    }

    await sleep(500);
  }

  throw new Error(`timed out waiting for local functions at ${healthUrl}`);
}

function readPidFile() {
  if (!existsSync(pidFile)) {
    return [];
  }

  const pid = Number(readFileSync(pidFile, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? [pid] : [];
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
    .filter((value) => Number.isInteger(value) && value > 0);
}

function killProcess(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch {
    // Already exited.
  }
}

function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForPidsToExit(pids, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (pids.every((pid) => !isProcessAlive(pid))) {
      return;
    }

    await sleep(200);
  }
}

async function checkHealth() {
  try {
    const response = await fetch(healthUrl, { method: "OPTIONS" });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: null };
  }
}

function readLastLog() {
  try {
    const text = readFileSync(logFile, "utf8");
    return text.slice(-4_000);
  } catch {
    return "";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
