import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootEnvironment = fileURLToPath(
  new URL("../../../.env", import.meta.url),
);
const rootEnvironmentExample = fileURLToPath(
  new URL("../../../.env.example", import.meta.url),
);

try {
  process.loadEnvFile(rootEnvironment);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  process.loadEnvFile(rootEnvironmentExample);
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
