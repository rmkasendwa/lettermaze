import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile(".env");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const command = process.argv[2];

if (command !== "dev" && command !== "start") {
  throw new Error(
    "Expected the Next.js command to be either 'dev' or 'start'.",
  );
}

const nextBinary = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(process.execPath, [nextBinary, command], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
