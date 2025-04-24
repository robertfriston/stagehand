// filepath: /Users/jobenvy/Documents/UTOPIA/stagehand/scripts/start_parallel_tests.ts
import { spawn, ChildProcess } from "child_process"; // Import ChildProcess
import path from "path";

const scriptsToRun = ["workflow_1.ts", "workflow_2.ts", "workflow_3.ts"];

const scriptDir = __dirname; // Gets the directory where start_parallel_tests.ts resides
const processes: ChildProcess[] = []; // Explicitly type the array
let failures = 0;

console.log(
  `Starting parallel execution of ${scriptsToRun.length} workflows...`,
);

scriptsToRun.forEach((scriptName) => {
  const scriptPath = path.join(scriptDir, scriptName);
  console.log(`Launching: ${scriptName}`);

  // Use 'tsx' if available (modern replacement for ts-node), otherwise fallback to 'ts-node'
  // Adjust the command based on your project setup (e.g., 'node dist/scripts/...')
  const command = "npx";
  const args = ["tsx", scriptPath]; // Or ['ts-node', scriptPath]

  const proc = spawn(command, args, {
    stdio: "inherit", // Inherit stdin, stdout, stderr from the parent process
    shell: true, // Use shell to handle npx correctly, especially on Windows
  });

  proc.on("error", (error) => {
    console.error(`Error starting ${scriptName}:`, error);
    failures++;
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`${scriptName} exited with code ${code}`);
      failures++;
    } else {
      console.log(`${scriptName} finished successfully.`);
    }
  });

  processes.push(proc);
});

// Optional: Wait for all processes to finish and report summary
Promise.all(
  processes.map((p) => new Promise((resolve) => p.on("close", resolve))),
).then(() => {
  console.log("-----------------------------------------");
  console.log("All workflows have completed.");
  if (failures > 0) {
    console.error(`${failures} workflow(s) failed.`);
    process.exit(1); // Exit with error code if any script failed
  } else {
    console.log("All workflows completed successfully.");
    process.exit(0);
  }
});

// Handle Ctrl+C to terminate child processes gracefully
process.on("SIGINT", () => {
  console.log("\nCaught interrupt signal. Terminating child processes...");
  processes.forEach((proc) => {
    proc.kill("SIGINT"); // Send SIGINT to child processes
  });
  // Give children a moment to exit before force killing
  setTimeout(() => {
    processes.forEach((proc) => {
      if (!proc.killed) {
        proc.kill("SIGTERM"); // Force kill if still running
      }
    });
    process.exit(1); // Exit main process
  }, 2000);
});
