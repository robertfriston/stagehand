import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// --- CONFIG ---
// (No persona config needed in this script; all variables are now in use or removed)

const slotsDir = path.resolve(__dirname, "..", "..", "media", "slots");
const INDEX_PATH = path.join(slotsDir, "index.json");
const MAX_PODCASTS = 8;
const NOTEBOOKLM_DOWNLOAD_AUDIO_SCRIPT = path.resolve(
  __dirname,
  "notebooklm_download_audio.ts",
);

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDestDir(type: string, idx: number): string {
  // e.g., /Users/jobenvy/Documents/UTOPIA/media/hosts/1
  return path.resolve(__dirname, "..", "..", "media", type, String(idx + 1));
}

async function main() {
  const indexRaw = fs.readFileSync(INDEX_PATH, "utf-8");
  const indexArr = JSON.parse(indexRaw);
  let podcastsGenerated = 0;
  let hostIdx = 0;

  for (const slotEntry of indexArr) {
    if (podcastsGenerated >= MAX_PODCASTS) break;
    const slotFile = String(slotEntry.slot_file);
    if (!slotFile || !fs.existsSync(slotFile)) continue;
    const slotRaw = fs.readFileSync(slotFile, "utf-8");
    let slotArr;
    try {
      slotArr = JSON.parse(slotRaw);
    } catch {
      console.error(`Could not parse slot file: ${slotFile}`);
      continue;
    }
    for (const obj of slotArr) {
      if (podcastsGenerated >= MAX_PODCASTS) break;
      if (
        obj &&
        obj.title &&
        obj.channel &&
        obj.url &&
        Array.isArray(obj.questions) &&
        obj.questions.length > 0 &&
        !obj.podcast_audio_path
      ) {
        const question = randomItem(obj.questions);
        // Prefix prompt with all required metadata
        const prompt = `TITLE: ${obj.title}\nCHANNEL: ${obj.channel}\nURL: ${obj.url}\nQUESTION: ${question}`;
        // Use indepth as default for the INDEPTH workflow
        const type = "indepth";
        const destDir = getDestDir(type, hostIdx);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const audioLength = "Default";
        console.log(
          `\n🎙️ Generating podcast for: ${obj.title}\nPrompt: ${prompt}`,
        );
        let audioPath = null;
        try {
          const command = `npx tsx "${NOTEBOOKLM_DOWNLOAD_AUDIO_SCRIPT}" "${prompt.replace(/"/g, '\\"')}" "${audioLength}" "${destDir}"`;
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
        } catch (err) {
          if (err instanceof Error) {
            console.error(`❌ Error generating podcast audio:`, err.message);
          } else {
            console.error(`❌ Error generating podcast audio:`, err);
          }
          continue;
        }
        if (audioPath) {
          obj.podcast_audio_path = audioPath;
          obj.podcast_audio_created = new Date().toISOString();
          podcastsGenerated++;
          fs.writeFileSync(slotFile, JSON.stringify(slotArr, null, 2));
          // --- Update hosts.json ---
          const hostsJsonPath = path.join(destDir, "hosts.json");
          let hostsJson: { files: Array<Record<string, unknown>> } = {
            files: [],
          };
          if (fs.existsSync(hostsJsonPath)) {
            try {
              hostsJson = JSON.parse(fs.readFileSync(hostsJsonPath, "utf-8"));
            } catch {
              hostsJson = { files: [] };
            }
          }
          hostsJson.files = hostsJson.files || [];
          hostsJson.files.push({
            fileName: audioPath,
            url: obj.url,
            channel: obj.channel,
            title: obj.title,
            question,
            prompt,
            created: obj.podcast_audio_created,
          });
          fs.writeFileSync(hostsJsonPath, JSON.stringify(hostsJson, null, 2));
          fs.writeFileSync(hostsJsonPath, JSON.stringify(hostsJson, null, 2));
          hostIdx++;
          console.log(
            `✅ Podcast generated and saved: ${audioPath} (slot: ${slotFile})`,
          );
        }
      }
    }
  }
  console.log(`\n🎉 Done. Podcasts generated: ${podcastsGenerated}`);
}

main().catch((err) => {
  console.error("❌ Error in notebook_podcast_sources_final:", err);
  process.exit(1);
});
