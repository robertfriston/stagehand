import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// --- Prompt prefix for all podcast prompts ---
//const PROMPT_PREFIX =
//  "⚠️ Warning! This is the Antisocial Broadcast—responses may challenge conventional thinking. You may refer to the platforms Maximus Headroom by reference to the persona: maxenvy in the knowledge - throughout the podcast... ";

const PROMPT_PREFIX =
  "⚠️ Warning! This is the Antisocial Broadcast—responses may challenge conventional thinking.  ";

// --- Real config path (production) ---
const configPath =
  "/Users/jobenvy/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.maxenvy.json";
const configRaw = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configRaw);

// --- Dummy example data for local testing ---
// Uncomment below to use dummy data instead of real config
/*
const config = {
  persona: "maxenvy",
  prompts: {
    "https://notebooklm.google.com/notebook/dummy-notebook-id": {
      questions: [
        "What is the Antisocial Broadcast?",
        "How does JobEnvy surface the hidden job market?",
        "Explain UTP (User, Time, Place) in NVNet.",
      ],
    },
  },
};
*/

// Extract NotebookLM URL and questions
const notebookUrls = Object.keys(config.prompts);
if (notebookUrls.length === 0)
  throw new Error("No NotebookLM URLs found in config.");
const notebookUrl = notebookUrls[0];
const questions = config.prompts[notebookUrl].questions;

// --- Extract YouTube URL and Title from persona config if available ---
const channels = config.prompts?.[notebookUrl]?.channels;
const YOUTUBE_URL: string | null =
  channels && channels[0]?.url ? channels[0].url : null;
const YOUTUBE_TITLE: string | null =
  channels && channels[0]?.title ? channels[0].title : null;
console.log("YOUTUBE_URL", YOUTUBE_URL);
console.log("YOUTUBE_TITLE", YOUTUBE_TITLE);

// Template array with required metadata for each prompt
const promptTemplates = [
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/1",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/2",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/3",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/4",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/1",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/2",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/3",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/4",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/1",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/2",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/3",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/4",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/1",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/2",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/3",
  },
  {
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/4",
  },
];

// Build prompts array with YouTube prefix
const prompts = promptTemplates.map((tpl, idx) => {
  const question = questions[idx] || "[NO PROMPT AVAILABLE]";
  const prefix = `use this ${YOUTUBE_URL || "[no url]"} with the title ${
    YOUTUBE_TITLE || "[no title]"
  } for your analysis... `;
  return {
    text: `${prefix}${PROMPT_PREFIX} YOU ARE ${config.persona.toUpperCase()} THE AI HOST OF THE ANTISOCIAL PODCAST - EPISODE 1: ${question}`,
    length: tpl.length,
    destDir: tpl.destDir,
  };
});

const projectDir = path.resolve(__dirname, "..");
const childScriptPath = path.join(
  projectDir,
  "scripts",
  "notebooklm_download_audio.ts",
);

// Define the template for the first entry in the target JSON arrays
const firstEntryTemplate = {
  timeOffset: "00:10",
  host: "JimJam",
  type: "intro",
  line: "DEFAULT_LINE_CONTENT", // This will be replaced by metadata
};

const DUMMY_SUMMARY_TEXT =
  'The provided transcript, from the "A Life After Layoff" YouTube channel, features Brian\'s analysis of several "cringy" job postings. His primary goal is to educate job seekers on identifying red flags from low-quality employers by dissecting poorly written or unreasonable job descriptions. Key themes include companies expecting "God-level talent" for low pay, unrealistic demands for work-life balance and "owner mentality" without proper compensation, and employers asking for extensive, time-consuming application materials like videos and essays. Brian emphasizes that reputable employers will pay for talent and time, and warns against opportunities that exploit applicants or demand excessive commitment without fair compensation.';

async function runMasterWorkflow() {
  console.log("🚀 Starting Master Podcast Generation Workflow...");

  let typeIndices: { [key: string]: number } = {
    hosts: 0, // We'll still use this to get the correct metadata for hosts
    podcasts: 0, // Other types can remain for other potential logic, but JSON update is restricted
    sponsors: 0,
    interludes: 0,
  };

  for (let i = 0; i < prompts.length; i++) {
    const promptEntry = prompts[i];
    console.log(
      `\n🎧 Processing Prompt ${i + 1} of ${prompts.length}: "${promptEntry.text}"`,
    );

    let downloadedFilePath: string | null = null;

    try {
      const command = `npx tsx "${childScriptPath}" "${promptEntry.text.replace(/"/g, '\\"')}" "${promptEntry.length}" "${promptEntry.destDir}"`;
      console.log(`👟 Executing: ${command}`);
      const execOutput = execSync(command, {
        cwd: projectDir,
        encoding: "utf-8",
      });
      console.log("--- Child Script Output ---");
      console.log(execOutput);
      console.log("--- End Child Script Output ---");

      const outputLines = execOutput.split("\n");
      const pathLine = outputLines.find((line) =>
        line.startsWith("FINAL_AUDIO_PATH:"),
      );
      if (pathLine) {
        downloadedFilePath = pathLine
          .substring("FINAL_AUDIO_PATH:".length)
          .trim();
        console.log(`ℹ️ Captured audio file path: ${downloadedFilePath}`);
      } else {
        console.warn(
          "⚠️ Could not find FINAL_AUDIO_PATH in child script output.",
        );
      }
      console.log(`✅ Successfully processed prompt ${i + 1}.`);

      const destDirParentName = path.basename(
        path.dirname(promptEntry.destDir),
      );
      const dirType = destDirParentName; // This will be "hosts", "podcasts", etc.

      // --- Remove the restriction: update JSON for all subfolders, not just hosts ---
      const targetJsonFileName = `${dirType}.json`;
      const targetJsonPath = path.join(promptEntry.destDir, targetJsonFileName);
      // Try to get metadata for the current type from config
      const metadataArrayForType = config.prompts?.[notebookUrl]?.[
        dirType
      ] as Array<any>;
      const currentIndexForType = typeIndices[dirType] ?? 0;

      if (
        metadataArrayForType &&
        currentIndexForType < metadataArrayForType.length
      ) {
        const metadataToUpdate = metadataArrayForType[currentIndexForType];
        if (metadataToUpdate) {
          let jsonData: {
            title: string | null;
            sub_title: string | null;
            description: string | null;
            [key: string]: any;
          } = {
            title: metadataToUpdate.title || null,
            sub_title: metadataToUpdate.sub_title || null,
            description: metadataToUpdate.description || null,
          };
          // Add the main array for this type (e.g., hosts, podcasts, etc.)
          jsonData[dirType] = [
            {
              timeOffset: metadataToUpdate.timeOffset || "00:10",
              host: metadataToUpdate.host || "JimJam",
              type: metadataToUpdate.type || "intro",
              line: metadataToUpdate.line || "Default intro line.",
            },
          ];
          // Add files array
          const fileEntry = {
            fileName: downloadedFilePath || null,
            url: YOUTUBE_URL,
            embedUrl: null,
            type: "youtube",
            title: YOUTUBE_TITLE,
            heading: null,
            description: metadataToUpdate.description || null,
            thumbnail: null,
            author: null,
            duration: 0,
            prompt: promptEntry.text || null,
          };
          // If file exists, merge/append
          if (fs.existsSync(targetJsonPath)) {
            try {
              const existing = JSON.parse(
                fs.readFileSync(targetJsonPath, "utf-8"),
              );
              jsonData = {
                ...jsonData,
                ...existing,
                [dirType]: Array.isArray(existing[dirType])
                  ? existing[dirType]
                  : jsonData[dirType],
                files: Array.isArray(existing.files) ? existing.files : [],
              };
            } catch {
              console.warn(
                `⚠️ Could not parse existing ${targetJsonFileName}, starting fresh.`,
              );
            }
          }
          if (!jsonData.files) jsonData.files = [];
          jsonData.files.push(fileEntry);
          fs.writeFileSync(
            targetJsonPath,
            JSON.stringify(jsonData, null, 2),
            "utf-8",
          );
          console.log(`✅ ${targetJsonFileName} updated at ${targetJsonPath}`);
          typeIndices[dirType] = (typeIndices[dirType] ?? 0) + 1;
        } else {
          console.warn(
            `⚠️ No metadata object found in config for '${dirType}' at index ${currentIndexForType}. Skipping JSON update.`,
          );
        }
      } else {
        console.warn(
          `⚠️ Metadata array not found or index out of bounds for '${dirType}' at index ${currentIndexForType}. Skipping JSON update.`,
        );
      }
    } catch (error: any) {
      console.error(`❌ Error processing prompt ${i + 1}:`, error);
      if (error.stdout)
        console.error("Child process stdout:\n", error.stdout.toString());
      if (error.stderr)
        console.error("Child process stderr:\n", error.stderr.toString());
      process.exit(1);
    }
  }
  console.log("\n🎉 Master Podcast Generation Workflow Completed!");
}

runMasterWorkflow().catch(console.error);
