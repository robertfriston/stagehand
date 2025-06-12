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

// Template array with required metadata for each prompt
const promptTemplates = [
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/1",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/2",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/3",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/4",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/1",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/2",
  },
  {
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/3",
  },
  {
    length: "Default",
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

// Build prompts array by injecting persona question text
const prompts = promptTemplates.map((tpl, idx) => ({
  text: questions[idx]
    ? `${PROMPT_PREFIX}YOU ARE ${config.persona.toUpperCase()} THE AI HOST OF THE ANTISOCIAL PODCAST - EPISODE 1: ${questions[idx]}`
    : `${PROMPT_PREFIX}YOU ARE ${config.persona.toUpperCase()} THE AI HOST OF THE ANTISOCIAL PODCAST - EPISODE 1: [NO PROMPT AVAILABLE]`,
  length: tpl.length,
  destDir: tpl.destDir,
}));

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

async function runMasterWorkflow() {
  console.log("🚀 Starting Master Podcast Generation Workflow...");

  // Initialize indices for each type of content
  let typeIndices: { [key: string]: number } = {
    hosts: 0,
    podcasts: 0,
    sponsors: 0,
    interludes: 0,
    // Add other types here if they exist and have corresponding JSON files/metadata
  };

  for (let i = 0; i < prompts.length; i++) {
    const promptEntry = prompts[i];
    console.log(
      `\n🎧 Processing Prompt ${i + 1} of ${prompts.length}: "${promptEntry.text}"`,
    );

    try {
      const command = `npx tsx "${childScriptPath}" "${promptEntry.text.replace(/"/g, '\\"')}" "${promptEntry.length}" "${promptEntry.destDir}"`;
      console.log(`👟 Executing: ${command}`);
      execSync(command, { stdio: "inherit", cwd: projectDir });
      console.log(`✅ Successfully processed prompt ${i + 1}.`);

      // --- BEGIN: Update dynamic JSON logic ---
      const destDirParentName = path.basename(
        path.dirname(promptEntry.destDir),
      ); // e.g., "hosts", "podcasts"
      const dirType = destDirParentName; // Assuming dirType matches the parent folder name

      if (config.prompts?.[notebookUrl]?.[dirType]) {
        const targetJsonFileName = `${dirType}.json`; // e.g., "hosts.json"
        const targetJsonPath = path.join(
          promptEntry.destDir,
          targetJsonFileName,
        );

        const metadataArrayForType = config.prompts[notebookUrl][
          dirType
        ] as Array<any>;
        const currentIndexForType = typeIndices[dirType];

        if (
          metadataArrayForType &&
          currentIndexForType < metadataArrayForType.length
        ) {
          const metadataToUpdate = metadataArrayForType[currentIndexForType];

          if (metadataToUpdate) {
            try {
              console.log(
                `📝 Creating/Overwriting ${targetJsonPath} with new template...`,
              );

              // Initialize the new JSON structure
              const newJsonData: any = {}; // Use 'any' for dynamic property assignment or define a specific interface

              // Populate title, sub_title, and description from metadata
              if (typeof metadataToUpdate.title === "string") {
                newJsonData.title = metadataToUpdate.title;
              }
              if (typeof metadataToUpdate.sub_title === "string") {
                newJsonData.sub_title = metadataToUpdate.sub_title;
              }
              if (typeof metadataToUpdate.description === "string") {
                newJsonData.description = metadataToUpdate.description;
              }

              // --- BEGIN: Create the single entry for the main array ---
              const dynamicLineContent =
                typeof metadataToUpdate.line === "string"
                  ? metadataToUpdate.line
                  : firstEntryTemplate.line;

              const singleEntry = {
                ...firstEntryTemplate,
                line: dynamicLineContent,
              };

              // Initialize the main array (e.g., 'hosts') with only the single entry
              newJsonData[dirType] = [singleEntry];
              // --- END: Create the single entry for the main array ---

              fs.writeFileSync(
                targetJsonPath,
                JSON.stringify(newJsonData, null, 2),
                "utf-8",
              );
              console.log(
                `✅ Successfully created/overwrote ${targetJsonPath}.`,
              );
              console.log(
                `📝 New content for ${dirType}[0].line: "${dynamicLineContent}"`,
              );

              typeIndices[dirType]++; // Increment index for this type
            } catch (updateError) {
              console.error(
                `❌ Error creating/overwriting ${targetJsonPath}:`,
                updateError,
              );
            }
          } else {
            console.warn(
              `⚠️ No metadata found or index out of bounds in config for type '${dirType}' at index ${currentIndexForType} (for ${promptEntry.destDir}). Skipping JSON update.`,
            );
          }
        } else {
          console.warn(
            `⚠️ No metadata found or index out of bounds in config for type '${dirType}' at index ${currentIndexForType} (for ${promptEntry.destDir}). Skipping JSON update.`,
          );
        }
      } else {
        // console.log(`ℹ️ No specific JSON update configured for directory type '${dirType}' (derived from ${promptEntry.destDir}). Skipping.`);
      }
      // --- END: Update dynamic JSON logic ---
    } catch (error) {
      console.error(`❌ Error processing prompt ${i + 1}:`, error);
      process.exit(1);
    }
  }

  console.log("\n🎉 Master Podcast Generation Workflow Completed!");
}

runMasterWorkflow().catch(console.error);
