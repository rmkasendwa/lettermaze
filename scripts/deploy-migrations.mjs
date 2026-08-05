import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const prisma = fileURLToPath(
  new URL("../apps/api/node_modules/prisma/build/index.js", import.meta.url),
);
const schema = fileURLToPath(
  new URL("../prisma/schema.prisma", import.meta.url),
);
const child = spawn(
  process.execPath,
  [prisma, "migrate", "deploy", "--schema", schema],
  { stdio: "inherit", env: process.env },
);
child.once("exit", (code) => process.exit(code ?? 1));
