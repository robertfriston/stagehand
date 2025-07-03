import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// --- DEBUGGING FLAG ---
const BLOCK_PODCAST_GENERATION = false; // Set to true to block actual podcast generation for debugging

// Load persona config for destinationFolder lookup (to match curated script)
const personaPath = process.env.PERSONA_JSON;
type PersonaConfig = {
  prompts?: {
    [notebookUrl: string]: {
      destinationFolder?: string;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
};
let personaConfig: PersonaConfig | null = null;
if (personaPath && fs.existsSync(personaPath)) {
  try {
    personaConfig = JSON.parse(fs.readFileSync(personaPath, "utf-8"));
  } catch {
    console.warn("Could not parse persona config at", personaPath);
  }
}

// --- Get the current notebook URL from environment or persona config ---
const CURRENT_NOTEBOOK_URL = String(
  process.env.NOTEBOOK_URL ||
    (personaConfig && personaConfig.currentNotebookUrl) ||
    "",
);
function normalizeNotebookUrl(url: string): string {
  // Remove query params for matching
  return url ? url.split("?")[0] : "";
}

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

function getPersonaDestFolder(notebookUrl: string): string {
  if (
    personaConfig &&
    personaConfig.prompts &&
    personaConfig.prompts[notebookUrl]
  ) {
    const dest = personaConfig.prompts[notebookUrl].destinationFolder;
    if (typeof dest === "string" && dest.trim()) return dest.trim();
  }
  return "hosts";
}

async function main() {
  const indexRaw = fs.readFileSync(INDEX_PATH, "utf-8");
  const indexArr = JSON.parse(indexRaw);
  let podcastsGenerated = 0;
  let hostIdx = 0;

  if (!CURRENT_NOTEBOOK_URL) {
    console.error(
      "❌ No NOTEBOOK_URL set in environment or persona config. Aborting.",
    );
    process.exit(1);
  }
  const normalizedCurrentNotebookUrl =
    normalizeNotebookUrl(CURRENT_NOTEBOOK_URL);

  // Only process slot files whose params.notebook_url matches the current notebook
  type SlotIndexEntry = {
    slot_file: string;
    params?: { notebook_url?: string };
  };
  const matchingSlotEntries = (indexArr as SlotIndexEntry[]).filter((entry) => {
    const entryUrl =
      entry.params && entry.params.notebook_url
        ? normalizeNotebookUrl(entry.params.notebook_url)
        : "";
    return entryUrl === normalizedCurrentNotebookUrl;
  });

  if (matchingSlotEntries.length === 0) {
    console.warn("⚠️ No slot files found for current notebook URL.");
    return;
  }

  for (const slotEntry of matchingSlotEntries) {
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
    const notebookUrl = slotEntry.params && slotEntry.params.notebook_url ? normalizeNotebookUrl(slotEntry.params.notebook_url) : "";
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
        // Use destinationFolder from persona if available, else default to hosts
        const type = getPersonaDestFolder(notebookUrl);
        obj.destinationFolder = type; // Persist the resolved destinationFolder in the slot object
        // Write slot file after updating destinationFolder, even if audio is not generated
        fs.writeFileSync(slotFile, JSON.stringify(slotArr, null, 2));
        const destDir = getDestDir(type, hostIdx);

        // Log only the actual metadata object being used for the prompt
        console.log(
          "[PODCAST META]",
          JSON.stringify(
            {
              slotFile,
              meta: obj,
              question,
              prompt,
              destinationFolder: type,
              destDir,
            },
            null,
            2,
          ),
        );

        if (BLOCK_PODCAST_GENERATION) {
          console.log(
            "⚡ BLOCK_PODCAST_GENERATION is enabled. Skipping podcast generation.",
          );
          continue;
        }

        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const audioLength = "Default";
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
          // Only add fields from obj that are not already present in the base entry
          const baseEntry = {
            fileName: audioPath,
            url: obj.url,
            channel: obj.channel,
            title: obj.title,
            question,
            prompt,
            created: obj.podcast_audio_created,
          };
          const mergedEntry = { ...obj, ...baseEntry };
          hostsJson.files.push(mergedEntry);
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
