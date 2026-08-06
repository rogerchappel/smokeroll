import { spawn } from "node:child_process";

const descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
  stdio: ["ignore", "inherit", "inherit"],
});

console.log(`descendant:${descendant.pid}`);
setInterval(() => {}, 1000);
