import { execSync } from "child_process";
import path from "path";

const projectDir = path.resolve(__dirname, ".."); // Resolves to the 'stagehand' directory
const childScriptPath = path.join(
  projectDir,
  "scripts",
  "notebooklm_download_audio.ts",
);

const prompts = [
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [HOME ENVY] AND ITS IMPACT ON SOCIETY.",
    length: "Default",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 2: TALK ABOUT [LOVE ENVY] AND THE CHALLENGES OF MODERN RELATIONSHIPS.",
    length: "Longer",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 3: TALK ABOUT [VIBE ENVY] AND THE GLOBAL WHATS ON GUIDE.",
    length: "Shorter",
  },
];

async function runMasterWorkflow() {
  console.log("🚀 Starting Master Podcast Generation Workflow...");

  for (let i = 0; i < prompts.length; i++) {
    const promptEntry = prompts[i];
    console.log(
      `\n🎧 Processing Prompt ${i + 1} of ${prompts.length}: "${promptEntry.text}" with length "${promptEntry.length}"`,
    );

    try {
      // Ensure the prompt text and length are correctly quoted for the command line
      const command = `npx tsx "${childScriptPath}" "${promptEntry.text.replace(/"/g, '\\"')}" "${promptEntry.length}"`;
      console.log(`👟 Executing: ${command}`);
      execSync(command, { stdio: "inherit", cwd: projectDir });
      console.log(`✅ Successfully processed prompt ${i + 1}.`);
    } catch (error) {
      console.error(`❌ Error processing prompt ${i + 1}:`, error);
      // Decide if you want to stop on error or continue with the next prompt
      // For now, it will stop. To continue, remove the 'process.exit(1)' or handle differently.
      process.exit(1);
    }
  }

  console.log("\n🎉 Master Podcast Generation Workflow Completed!");
}

runMasterWorkflow().catch(console.error);
