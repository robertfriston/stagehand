import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  // Get prompt from command line arguments
  const promptText = process.argv[2];
  if (!promptText) {
    console.error(
      "❌ Error: No prompt provided. Please pass the prompt as a command-line argument.",
    );
    process.exit(1);
  }
  console.log(`ℹ️ Using prompt: "${promptText}"`);

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

  // Step 1: Click Customize button (match style of other button clicks)
  const clickedCustomize = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    // Find visible Customize button
    const customize = btns.find(
      (el) =>
        el.textContent?.trim() === "Customize" && el.offsetParent !== null,
    );
    if (customize instanceof HTMLElement) {
      customize.click();
      return true;
    }
    return false;
  });
  if (!clickedCustomize) return console.error("❌ Customize button not found");
  console.log("🛠️ Clicked Customize");
  await page.waitForSelector('textarea, [role="textbox"]', { timeout: 10000 });

  // Step 2: Type prompt in modal
  // const promptText = // This line is now replaced by the argument from process.argv[2]
  //   "YOU ARE JIMJAM AND DENNY THE AI HOSTS OF THE ANTISOCIAL PODCAST - BUILD ON THE LAST INFORMATION YOU HAVE BEEN GIVEN IN THE SCOURCE DOCUMENTS TO CREATE AN ENGAING PODCAST EPISODE";
  // Try textarea first, then [role="textbox"]
  let inputSelector = "textarea";
  let inputBox = await page.$(inputSelector);
  if (!inputBox) {
    inputSelector = '[role="textbox"]';
    inputBox = await page.$(inputSelector);
  }
  if (!inputBox)
    return console.error("❌ Could not find prompt input in modal");
  await inputBox.click({ clickCount: 3 });
  await inputBox.type(promptText, { delay: 10 });
  console.log("✍️ Prompt entered");

  // Step 3: Click Generate in modal
  const clickedModalGenerate = await page.evaluate(() => {
    const modalDialog = document.querySelector(
      ".mat-mdc-dialog-container, .cdk-overlay-pane",
    );
    if (!modalDialog) {
      console.error("Modal dialog not found");
      return false;
    }

    const buttons = Array.from(modalDialog.querySelectorAll("button"));
    for (const btn of buttons) {
      const span = btn.querySelector("span"); // Most Material buttons have text in a span
      const buttonText = (span?.textContent || btn.textContent || "").trim();

      if (buttonText === "Generate" && btn.offsetParent !== null) {
        // Check if visible
        (btn as HTMLElement).click();
        return true;
      }
    }
    // Fallback if no span or direct text match, try buttons with 'generate' in class or text
    for (const btn of buttons) {
      const buttonText = (btn.textContent || "").toLowerCase();
      const classList = (btn.className || "").toLowerCase();
      if (
        (buttonText.includes("generate") || classList.includes("generate")) &&
        btn.offsetParent !== null
      ) {
        (btn as HTMLElement).click();
        console.log("Clicked modal generate button via fallback");
        return true;
      }
    }
    return false;
  });

  if (!clickedModalGenerate) {
    return console.error("❌ Generate button in modal not found");
  }
  console.log("⚙️ Clicked Generate in modal — waiting up to 15 minutes...");

  await page.waitForSelector('button[aria-label^="Play"]', {
    timeout: 15 * 60 * 1000,
  }); // 15 minutes
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
  const timeout = 15 * 60 * 1000; // 15 minutes
  const pollInterval = 1000;
  const audioPattern = /^.*\.(mp3|wav)$/;

  // Record files before download
  const beforeFiles = new Set(fs.readdirSync(downloadsDir));

  let elapsed = 0;
  let audioFile = "";

  while (elapsed < timeout) {
    const files = fs.readdirSync(downloadsDir);
    console.log("[DEBUG] Files in Downloads:", files);
    // Only consider new files
    const newFiles = files.filter(
      (f) => !beforeFiles.has(f) && audioPattern.test(f),
    );
    if (newFiles.length > 0) {
      audioFile = newFiles[0];
      break;
    }
    await new Promise((res) => setTimeout(res, pollInterval));
    elapsed += pollInterval;
  }

  if (!audioFile) return console.error("❌ Audio file not downloaded in time");

  const srcPath = path.join(downloadsDir, audioFile);
  const destDir = path.resolve("./output");

  // Preserve extension and add timestamp
  const ext = path.extname(audioFile);
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS
  const destPath = path.join(destDir, `notebooklm_podcast_${timestamp}${ext}`);

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
  fs.renameSync(srcPath, destPath);
  console.log(`✅ Audio saved to: ${destPath}`);

  // Step 7: Re-open 3-dot menu and click Delete
  // Find the 3-dot menu button again (in case DOM changed)
  let menuButton2 = null;
  const allButtons2 = await page.$$("button");
  for (const btn of allButtons2) {
    const html = await btn.evaluate((el) => el.innerHTML);
    if (html.includes("more_vert")) {
      menuButton2 = btn;
      break;
    }
  }
  if (!menuButton2)
    return console.error("❌ Could not find 3-dot audio menu for delete");
  await menuButton2.click();
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
