import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

// --- CONFIG ---
const slotsDir = path.resolve(__dirname, "..", "..", "media", "slots");
const INDEX_PATH = path.join(slotsDir, "index.json");
const MAX_PODCASTS = 8;
const NOTEBOOKLM_DOWNLOAD_AUDIO_SCRIPT = path.resolve(
  __dirname,
  "notebooklm_download_audio.ts",
);
const AUDIO_OUTPUT_BASE = path.join(os.homedir(), "Downloads"); // or customize as needed

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const indexRaw = fs.readFileSync(INDEX_PATH, "utf-8");
  const indexArr = JSON.parse(indexRaw);
  let podcastsGenerated = 0;

  for (const slotEntry of indexArr) {
    if (podcastsGenerated >= MAX_PODCASTS) break;
    const slotFile = String(slotEntry.slot_file);
    if (!slotFile || !fs.existsSync(slotFile)) continue;
    const slotRaw = fs.readFileSync(slotFile, "utf-8");
    let slotArr;
    try {
      slotArr = JSON.parse(slotRaw);
    } catch (e) {
      console.error(`Could not parse slot file: ${slotFile}`);
      continue;
    }
    let updated = false;
    for (const obj of slotArr) {
      if (podcastsGenerated >= MAX_PODCASTS) break;
      if (
        obj &&
        obj.title &&
        Array.isArray(obj.questions) &&
        obj.questions.length > 0 &&
        !obj.podcast_audio_path // Only if not already generated
      ) {
        const prompt = randomItem(obj.questions);
        const audioLength = "Default"; // Or customize if you want
        const destDir = AUDIO_OUTPUT_BASE; // Or customize per slot
        console.log(
          `\n🎙️ Generating podcast for: ${obj.title}\nPrompt: ${prompt}`,
        );
        // Call the real Puppeteer workflow as a child process
        let audioPath = null;
        try {
          const command = `npx tsx "${NOTEBOOKLM_DOWNLOAD_AUDIO_SCRIPT}" "${prompt.replace(/\"/g, '\\"')}" "${audioLength}" "${destDir}"`;
          console.log(`👟 Executing: ${command}`);
          const execOutput = execSync(command, { encoding: "utf-8" });
          const outputLines = execOutput.split("\n");
          const pathLine = outputLines.find((line) =>
            line.startsWith("FINAL_AUDIO_PATH:"),
          );
          if (pathLine) {
            audioPath = pathLine.substring("FINAL_AUDIO_PATH:".length).trim();
            console.log(`✅ Audio file path: ${audioPath}`);
          } else {
            console.warn(
              "⚠️ Could not find FINAL_AUDIO_PATH in child script output.",
            );
          }
        } catch (err: any) {
          console.error(`❌ Error generating podcast audio:`, err.message);
          continue;
        }
        if (audioPath) {
          obj.podcast_audio_path = audioPath;
          obj.podcast_audio_created = new Date().toISOString();
          updated = true;
          podcastsGenerated++;
          fs.writeFileSync(slotFile, JSON.stringify(slotArr, null, 2));
          console.log(
            `✅ Podcast generated and saved: ${audioPath} (slot: ${slotFile})`,
          );
        }
      }
    }
    // Already saved above if updated
  }
  console.log(`\n🎉 Done. Podcasts generated: ${podcastsGenerated}`);
}

main().catch((err) => {
  console.error("❌ Error in notebook_podcast_sources_real:", err);
  process.exit(1);
});
