import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  console.log("🎙️ Connecting to Chrome...");

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
  });

  const pages = await browser.pages();
  console.log(`🧭 Found ${pages.length} open pages:`);

  for (const p of pages) {
    console.log(`  → ${p.url()}`);
  }

  const page = pages.find(
    (p) =>
      p.url().includes("notebooklm.google.com") &&
      p.mainFrame().url().includes("notebooklm.google.com"),
  );

  if (!page) {
    console.error("❌ No suitable NotebookLM tab found.");
    return;
  }

  console.log("✅ Attached to NotebookLM tab");

  // Step 1: Click Studio tab using raw evaluate
  const clicked = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("div"));
    const studio = elements.find((el) => el.textContent?.trim() === "Studio");
    if (studio instanceof HTMLElement) {
      studio.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.error("❌ Studio tab not found via text match.");
    return;
  }

  console.log("🎬 Clicked Studio tab");
  await page.waitForTimeout(3000);

  // Step 2: Click 3-dot menu (More actions)
  const menuButton = await page.$('button[aria-label="More actions"]');
  if (!menuButton) {
    console.error("❌ Menu button not found");
    return;
  }

  await menuButton.click();
  await page.waitForTimeout(1000);

  // Step 3: Click "Download audio"
  const downloadClicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("span"));
    const target = items.find((el) =>
      el.textContent?.includes("Download audio"),
    );
    if (target instanceof HTMLElement) {
      target.click();
      return true;
    }
    return false;
  });

  if (!downloadClicked) {
    console.error("❌ Download audio option not found.");
    return;
  }

  console.log("📥 Clicked Download audio");

  // Step 4: Wait for MP3 download
  const downloadsDir = path.join(os.homedir(), "Downloads");
  const timeout = 20000;
  const pollInterval = 1000;
  const mp3Pattern = /^.*\.mp3$/;

  let elapsed = 0;
  let mp3File = "";

  while (elapsed < timeout) {
    const files = fs.readdirSync(downloadsDir);
    const match = files.find((f) => mp3Pattern.test(f));
    if (match) {
      mp3File = match;
      break;
    }
    await new Promise((res) => setTimeout(res, pollInterval));
    elapsed += pollInterval;
  }

  if (!mp3File) {
    console.error("❌ MP3 not downloaded in time.");
    return;
  }

  // Step 5: Move file
  const srcPath = path.join(downloadsDir, mp3File);
  const destDir = path.resolve("./output");
  const destPath = path.join(destDir, "notebooklm_podcast.mp3");

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
  fs.renameSync(srcPath, destPath);

  console.log(`✅ MP3 saved to: ${destPath}`);
}

run().catch(console.error);
