import { execSync } from "child_process";
import path from "path";

const projectDir = path.resolve(__dirname, ".."); // Resolves to the 'stagehand' directory
const childScriptPath = path.join(
  projectDir,
  "scripts",
  "notebooklm_download_audio.ts",
);

const prompts = [
  //   {
  //     text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [JOB ENVY] AND ITS IMPACT ON SOCIETY.",
  //     length: "Shorter",
  //     destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/1",
  //   },
  //   {
  //     text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [HOME ENVY] AND ITS IMPACT ON SOCIETY.",
  //     length: "Shorter",
  //     destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/2",
  //   },
  //   {
  //     text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [LOVE ENVY] AND THE CHALLENGES OF MODERN RELATIONSHIPS.",
  //     length: "Shorter",
  //     destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/3",
  //   },
  //   {
  //     text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [VIBE ENVY] AND THE GLOBAL WHATS ON GUIDE.",
  //     length: "Shorter",
  //     destDir: "/Users/jobenvy/Documents/UTOPIA/media/hosts/4",
  //   },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [JOB ENVY] AND ITS IMPACT ON SOCIETY.",
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/1",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [HOME ENVY] AND ITS IMPACT ON SOCIETY.",
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/2",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [LOVE ENVY] AND THE CHALLENGES OF MODERN RELATIONSHIPS.",
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/3",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [VIBE ENVY] AND THE GLOBAL WHATS ON GUIDE.",
    length: "Default",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/podcasts/4",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [JOB ENVY] AS A SPONSOR AND ITS IMPACT ON SOCIETY.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/1",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [HOME ENVY] AS A SPONSOR AND ITS IMPACT ON SOCIETY.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/2",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [LOVE ENVY] AS A SPONSOR AND THE CHALLENGES OF MODERN RELATIONSHIPS.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/3",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [VIBE ENVY] AS A SPONSOR AND THE GLOBAL WHATS ON GUIDE.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/sponsors/4",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [JOB ENVY] AS FUN AND UPLIFTING INTERLUDE.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/1",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [HOME ENVY] AS FUN AND UPLIFTING INTERLUDE.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/2",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [LOVE ENVY] AS FUN AND UPLIFTING INTERLUDE.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/3",
  },
  {
    text: "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - EPISODE 1: TALK ABOUT [VIBE ENVY] AS FUN AND UPLIFTING INTERLUDE.",
    length: "Shorter",
    destDir: "/Users/jobenvy/Documents/UTOPIA/media/interludes/4",
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
      const command = `npx tsx "${childScriptPath}" "${promptEntry.text.replace(/"/g, '\\"')}" "${promptEntry.length}" "${promptEntry.destDir}"`;
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
