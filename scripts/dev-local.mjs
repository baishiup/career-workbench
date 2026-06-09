import { spawn } from "node:child_process";

const children = new Set();
let isShuttingDown = false;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
      ...options,
    });

    children.add(child);
    pipeWithPrefix(options.prefix ?? command, child.stdout);
    pipeWithPrefix(options.prefix ?? command, child.stderr);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      children.delete(child);

      if (signal || code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function spawnLongRunning(command, args, prefix) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.add(child);
  pipeWithPrefix(prefix, child.stdout);
  pipeWithPrefix(prefix, child.stderr);

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (!isShuttingDown && code !== 0) {
      console.error(`[${prefix}] exited with code ${code ?? signal}`);
      shutdown(1);
    }
  });

  return child;
}

function pipeWithPrefix(prefix, stream) {
  stream.on("data", (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim().length > 0) {
        console.log(`[${prefix}] ${line}`);
      }
    }
  });
}

function shutdown(code = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  console.log("[local] starting Supabase local stack...");
  await run("supabase", ["start"], { prefix: "supabase" });

  spawnLongRunning(
    "supabase",
    [
      "functions",
      "serve",
      "--env-file",
      "supabase/.env.local",
      "--import-map",
      "supabase/functions/import_map.json",
      "--no-verify-jwt",
    ],
    "functions",
  );

  spawnLongRunning(
    "pnpm",
    ["--filter", "@career-workbench/web", "dev:local"],
    "web",
  );
} catch (error) {
  console.error(`[local] ${error instanceof Error ? error.message : error}`);
  shutdown(1);
}
