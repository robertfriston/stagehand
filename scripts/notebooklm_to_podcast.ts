// /Users/jobenvy/Documents/UTOPIA/stagehand/scripts/notebooklm_download_audio.ts
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  console.log("🔌 Connecting to Chrome...");
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages.find((p) =>
    p.url().includes("notebooklm.google.com/notebook"),
  );

  if (!page) {
    console.error("❌ No NotebookLM tab found.");
    return;
  }

  console.log("✅ Attached to NotebookLM tab");

  // Click the Studio tab if not already active
  const [studioTab] = await page.$x("//div[contains(text(), 'Studio')]");
  if (studioTab) {
    await studioTab.click();
    console.log("🎬 Studio tab clicked");
    await page.waitForTimeout(2000);
  }

  // Click the 3-dot menu
  const menuButton = await page.waitForSelector(
    'button[aria-label="More actions"]',
    { timeout: 10000 },
  );
  await menuButton.click();
  await page.waitForTimeout(500);

  // Click "Download audio"
  const [downloadOption] = await page.$x(
    "//span[contains(text(), 'Download audio')]",
  );
  if (!downloadOption) {
    console.error("❌ Could not find 'Download audio' option.");
    return;
  }

  await downloadOption.click();
  console.log("📥 Download started...");

  // Wait for .mp3 to appear in Downloads
  const downloadsDir = path.join(os.homedir(), "Downloads");
  const timeout = 20000;
  const pollInterval = 1000;
  let foundFile = "";
  let elapsed = 0;

  while (elapsed < timeout) {
    const files = fs.readdirSync(downloadsDir);
    const mp3File = files.find((f) => f.endsWith(".mp3"));
    if (mp3File) {
      foundFile = mp3File;
      break;
    }
    await new Promise((res) => setTimeout(res, pollInterval));
    elapsed += pollInterval;
  }

  if (!foundFile) {
    console.error("❌ No MP3 download found in time.");
    return;
  }

  // Move to output/
  const destDir = path.resolve("./output");
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
  const srcPath = path.join(downloadsDir, foundFile);
  const destPath = path.join(destDir, "notebooklm_podcast.mp3");

  fs.renameSync(srcPath, destPath);
  console.log(`✅ MP3 saved to: ${destPath}`);
}

run().catch(console.error);
