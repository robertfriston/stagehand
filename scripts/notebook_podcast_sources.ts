// --- notebook_podcast_sources.ts ---
import fs from "fs";
import path from "path";
import os from "os";

// --- CONFIG ---
const slotsDir = path.resolve(__dirname, "..", "..", "media", "slots");
const INDEX_PATH = path.join(slotsDir, "index.json");
const MAX_PODCASTS = 8;
const AUDIO_OUTPUT_DIR = path.join(os.homedir(), "Downloads"); // or customize as needed

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Replace this with actual podcast/audio generation logic
async function generatePodcastAudio(
  prompt: string,
  slotObj: any,
  slotFile: string,
): Promise<string> {
  // Simulate audio file creation
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const audioFile = path.join(
    AUDIO_OUTPUT_DIR,
    `podcast_${timestamp}_${Math.floor(Math.random() * 10000)}.mp3`,
  );
  fs.writeFileSync(audioFile, "FAKE AUDIO DATA");
  await sleep(1000); // Simulate processing
  return audioFile;
}

async function main() {
  // 1. Load index.json
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
        console.log(
          `\n🎙️ Generating podcast for: ${obj.title}\nPrompt: ${prompt}`,
        );
        // Generate podcast audio (replace with actual logic)
        const audioPath = await generatePodcastAudio(prompt, obj, slotFile);
        obj.podcast_audio_path = audioPath;
        obj.podcast_audio_created = new Date().toISOString();
        updated = true;
        podcastsGenerated++;
        // Save after each podcast
        fs.writeFileSync(slotFile, JSON.stringify(slotArr, null, 2));
        console.log(
          `✅ Podcast generated and saved: ${audioPath} (slot: ${slotFile})`,
        );
        await sleep(500); // Optional: throttle
      }
    }
    // Already saved above if updated
  }
  console.log(`\n🎉 Done. Podcasts generated: ${podcastsGenerated}`);
}

main().catch((err) => {
  console.error("❌ Error in notebook_podcast_sources:", err);
  process.exit(1);
});
