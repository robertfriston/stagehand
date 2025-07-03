/**
 * Simplified discover step for the Curated workflow.
 * The notebook already contains curated sources, so we just wait
 * before handing off to the transcription step.
 */
import { setTimeout as wait } from "timers/promises";

async function run() {
  console.log("⏳ [CURATED DISCOVER] Waiting 60 seconds before continuing...");
  await wait(60_000);
  console.log("✅ [CURATED DISCOVER] Wait complete.");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
