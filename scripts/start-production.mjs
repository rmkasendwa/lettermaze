import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const apiPort = process.env.API_PORT ?? "4000";
const internalApiUrl = process.env.INTERNAL_API_URL;
if (!internalApiUrl) throw new Error("INTERNAL_API_URL is required.");
const apiEntry = fileURLToPath(
  new URL("../apps/api/dist/main.js", import.meta.url),
);
const webEntry = fileURLToPath(
  new URL("../apps/web/.next/standalone/apps/web/server.js", import.meta.url),
);
const processes = new Set();
let shuttingDown = false;

function start(entry, env) {
  const child = spawn(process.execPath, [entry], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  processes.add(child);
  child.once("exit", (code, signal) => {
    processes.delete(child);
    if (!shuttingDown) shutdown(code ?? (signal ? 1 : 0));
  });
  return child;
}

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) child.kill("SIGTERM");
  const timer = setTimeout(() => {
    for (const child of processes) child.kill("SIGKILL");
  }, 10_000);
  timer.unref();
  Promise.all(
    [...processes].map(
      (child) => new Promise((resolve) => child.once("exit", resolve)),
    ),
  ).finally(() => process.exit(exitCode));
}

async function waitForApi() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${internalApiUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("API did not become healthy within 30 seconds.");
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

start(apiEntry, { API_PORT: apiPort });
try {
  await waitForApi();
  start(webEntry, { HOSTNAME: "0.0.0.0", PORT: process.env.PORT ?? "3000" });
} catch (error) {
  console.error(error);
  shutdown(1);
}
