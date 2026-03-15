import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "..");
const distDir = path.join(serverDir, "dist");
const packageDir = path.resolve(serverDir, "..", "..", ".lambda-package");
const zipPath = path.resolve(serverDir, "..", "..", "lambda-deploy.zip");

const runtimePackageJson = {
  name: "hono-github-app-lambda",
  private: true,
  type: "module",
  dependencies: {
    "@hono/trpc-server": "0.4.2",
    "@t3-oss/env-core": "0.13.10",
    "@trpc/server": "11.12.0",
    "dotenv": "17.3.1",
    "drizzle-orm": "0.45.1",
    "hono": "4.12.8",
    "pg": "8.20.0",
    "zod": "4.3.6",
  },
};

fs.rmSync(packageDir, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });

for (const entry of fs.readdirSync(distDir)) {
  fs.copyFileSync(path.join(distDir, entry), path.join(packageDir, entry));
}

fs.writeFileSync(path.join(packageDir, "package.json"), `${JSON.stringify(runtimePackageJson, null, 2)}\n`);

const installResult = spawnSync("npm", ["install", "--omit=dev"], {
  cwd: packageDir,
  env: {
    ...process.env,
    CI: "true",
    npm_config_ignore_scripts: "true",
  },
  stdio: "inherit",
});

if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}

fs.rmSync(zipPath, { force: true });

const zipResult = spawnSync("zip", ["-r", zipPath, "."], {
  cwd: packageDir,
  stdio: "inherit",
});

if (zipResult.status !== 0) {
  process.exit(zipResult.status ?? 1);
}

console.log(`\nLambda deployment package created at ${zipPath}`);
