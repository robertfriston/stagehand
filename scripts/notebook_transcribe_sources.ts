import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

interface SlotSource {
  title: string;
  url: string;
  channel: string;
}

interface SlotData {
  prompt: string;
  created_at: string;
  count: number;
  sources: SlotSource[];
  params: {
    script: string;
    notebook_url: string;
  };
}

/**
 * Finds the most recently created slot file in the media/slots directory.
 */
function getLatestSlotFile(): string | null {
  const slotsDir = path.resolve(__dirname, "..", "..", "media", "slots");
  if (!fs.existsSync(slotsDir)) {
    console.warn(
      `⚠️ Slots directory not found at ${slotsDir}. Creating it now.`,
    );
    fs.mkdirSync(slotsDir, { recursive: true });
  }

  const files = fs
    .readdirSync(slotsDir)
    .filter((file) => file.startsWith("slot-") && file.endsWith(".json"))
    .map((file) => ({
      file,
      mtime: fs.statSync(path.join(slotsDir, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) {
    console.error(`❌ Error: No slot files found in ${slotsDir}.`);
    console.log(
      "ℹ️ Please run the 'discover sources' workflow (option 3) first to generate a slot file.",
    );
    return null;
  }

  return path.join(slotsDir, files[0].file);
}

async function run() {
  console.log("🚀 Starting NotebookLM Transcribe Sources Workflow...");

  const latestSlotFile = getLatestSlotFile();
  if (!latestSlotFile) {
    return;
  }

  console.log(`ℹ️ Using data from the latest slot file: ${latestSlotFile}`);
  const slotData: SlotData = JSON.parse(
    fs.readFileSync(latestSlotFile, "utf-8"),
  );
  const sourcesToProcess = slotData.sources.map((s) => s.title);

  if (!sourcesToProcess || sourcesToProcess.length === 0) {
    console.log("🤷 No sources to process in the slot file. Exiting.");
    return;
  }

  console.log(
    `🎯 Will attempt to find and click the following ${sourcesToProcess.length} source(s):`,
  );
  sourcesToProcess.forEach((title: string) => console.log(`  - ${title}`));

  let browser;
  try {
    console.log("🔗 Connecting to running Chrome instance...");
    browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
      protocolTimeout: 900000,
    });
    console.log("✅ Connected to Chrome");

    const notebookPage = (await browser.pages()).find((p) =>
      p.url().includes("notebooklm.google.com/notebook/"),
    );

    if (!notebookPage) {
      console.error(
        "❌ No NotebookLM tab found. Please open a notebook first.",
      );
      return;
    }

    console.log("📄 Found NotebookLM tab:", notebookPage.url());
    await notebookPage.bringToFront();

    // Wait for a bit to ensure sources are loaded in the UI
    console.log(
      "⏳ Waiting for 60 seconds to ensure sources are fully imported and rendered...",
    );
    await new Promise((r) => setTimeout(r, 60000));

    for (const sourceTitle of sourcesToProcess) {
      console.log(`🔍 Searching for source: "${sourceTitle}"`);

      // This selector is a best-guess. It might need to be adjusted based on
      // the actual HTML structure of the source list in NotebookLM.
      const sourceElement = await notebookPage.evaluateHandle((title) => {
        const sourceElements = Array.from(
          document.querySelectorAll(".source-list-item .title"), // This selector was in the original file
        );
        // Use .includes() for a more flexible match against the title.
        return sourceElements.find((el) =>
          el.textContent?.trim().includes(title),
        ) as HTMLElement | undefined;
      }, sourceTitle);

      if (sourceElement && sourceElement.asElement()) {
        console.log(`  ✅ Found \"${sourceTitle}\". Clicking to process...`);
        await (sourceElement.asElement() as puppeteer.ElementHandle).click();
        await sourceElement.dispose();
        // Wait a few seconds for NotebookLM to process the source
        await new Promise((r) => setTimeout(r, 5000));
        console.log(`  ✅ Finished processing "${sourceTitle}".`);
      } else {
        console.warn(
          `  ⚠️ Could not find source element for: "${sourceTitle}"`,
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ An error occurred during the transcription workflow:",
      error,
    );
  } finally {
    if (browser) {
      await browser.disconnect();
    }
    console.log("🎉 Transcription workflow finished.");
  }
}

run().catch((error) => {
  console.error("❌ An unexpected top-level error occurred:", error);
  process.exit(1);
});
