import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  console.log("🎙️ Connecting to Chrome...");

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
    protocolTimeout: 900000,
  });

  const pages = await browser.pages();
  const page = pages.find(
    (p) =>
      p.url().includes("notebooklm.google.com") &&
      p.mainFrame().url().includes("notebooklm.google.com"),
  );

  if (!page) {
    console.error("❌ NotebookLM tab not found");
    return;
  }

  console.log("✅ Attached to NotebookLM tab");


  // Try clicking Generate first
  let clickedGenerate = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("button span"));
    const generate = spans.find((el) => el.textContent?.trim() === "Generate");
    if (generate?.parentElement instanceof HTMLElement) {
      generate.parentElement.click();
      return true;
    }
    return false;
  });

  if (!clickedGenerate) {
    // If not found, try clicking Studio tab, then try Generate again
    const clickedStudio = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll("div"));
      const studio = divs.find((el) => el.textContent?.trim() === "Studio");
      if (studio instanceof HTMLElement) studio.click();
      return !!studio;
    });

    if (!clickedStudio) return console.error("❌ Studio tab not found");
    console.log("🎬 Clicked Studio tab");
    await new Promise((r) => setTimeout(r, 2000));

    clickedGenerate = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("button span"));
      const generate = spans.find((el) => el.textContent?.trim() === "Generate");
      if (generate?.parentElement instanceof HTMLElement) {
        generate.parentElement.click();
        return true;
      }
      return false;
    });
  }

  if (!clickedGenerate) return console.error("❌ Generate button not found");
  console.log("⚙️ Clicked Generate — waiting up to 15 minutes...");

  await page.waitForSelector('button[aria-label^="Play"]', { timeout: 900000 });
  console.log("✅ Audio generation complete — player is visible");

  const allButtons = await page.$$("button");
  let menuButton = null;

  for (const btn of allButtons) {
    const html = await btn.evaluate((el) => el.innerHTML);
    if (html.includes("more_vert")) {
      menuButton = btn;
      break;
    }
  }

  if (!menuButton) {
    console.error("❌ Could not find 3-dot audio menu");
    return;
  }

  await menuButton.click();
  await new Promise((r) => setTimeout(r, 1000));
  console.log("✅ Opened 3-dot menu");

  const clickedDownload = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const target = spans.find((el) => el.textContent?.trim() === "Download");
    if (target instanceof HTMLElement) {
      target.click();
      return true;
    }
    return false;
  });

  if (!clickedDownload) return console.error("❌ Download option not found");
  console.log("📥 Downloading MP3...");

  const downloadsDir = path.join(os.homedir(), "Downloads");
  const timeout = 30000;
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

  if (!mp3File) return console.error("❌ MP3 not downloaded in time");

  const srcPath = path.join(downloadsDir, mp3File);
  const destDir = path.resolve("./output");
  const destPath = path.join(destDir, "notebooklm_podcast.mp3");

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
  fs.renameSync(srcPath, destPath);
  console.log(`✅ MP3 saved to: ${destPath}`);

  // Step 7: Open 3-dot menu again and click Delete
  await menuButton.click();
  await new Promise((r) => setTimeout(r, 500));

  const clickedDelete = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const del = spans.find((el) => el.textContent?.trim() === "Delete");
    if (del instanceof HTMLElement) {
      del.click();
      return true;
    }
    return false;
  });

  if (!clickedDelete) return console.error("❌ Delete option not found");
  console.log("🗑️ Delete menu clicked");

  // Step 8: Confirm the deletion in modal
  await page
    .waitForSelector('button span:text("Delete")', { timeout: 10000 })
    .catch(() => null);
  const clickedConfirm = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("button span"));
    const confirm = spans.find((el) => el.textContent?.trim() === "Delete");
    if (confirm?.parentElement instanceof HTMLElement) {
      confirm.parentElement.click();
      return true;
    }
    return false;
  });

  if (!clickedConfirm) return console.error("❌ Could not confirm Delete");
  console.log("✅ Audio clip deleted");

  await browser.disconnect();
}

run().catch(console.error);
