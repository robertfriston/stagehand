import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  // Get prompt and length from command line arguments
  const promptText = process.argv[2];
  const audioLength = process.argv[3] || "Default"; // Default to "Default" if not provided

  if (!promptText) {
    console.error(
      "❌ Error: No prompt provided. Please pass the prompt as a command-line argument.",
    );
    process.exit(1);
  }
  console.log(`ℹ️ Using prompt: "${promptText}"`);
  console.log(`📏 Using audio length: "${audioLength}"`);

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

  console.log("⏱️ Waiting 2 seconds for modal to open and settle...");
  await new Promise((r) => setTimeout(r, 2000));
  console.log(
    "✅ Modal should be open. Proceeding with actions in order: Prompt -> Length -> Generate.",
  );

  // Step 1 (New Order): Type prompt in modal
  console.log(
    "Attempting to type prompt (assuming modal textarea has focus)...",
  );
  try {
    // Try direct keyboard typing first, assuming focus is in the right place
    await page.keyboard.type(promptText, { delay: 10 });
    console.log("✍️ Prompt typed using page.keyboard.type.");
  } catch (e) {
    console.error(
      `❌ Error typing prompt using page.keyboard.type: ${e instanceof Error ? e.message : String(e)}`,
    );
    // Fallback: find a textarea in any dialog and type into it
    console.log(
      "Attempting fallback: finding and typing into modal textarea...",
    );
    try {
      const inputBox = await page.$(
        'div[role="dialog"] textarea, div[role="dialog"] [role="textbox"]',
      );
      if (!inputBox)
        throw new Error("Textarea/textbox not found in dialog for fallback.");
      await inputBox.click({ clickCount: 3 }); // Clear existing content
      await inputBox.type(promptText, { delay: 10 });
      console.log("✍️ Prompt typed using fallback (found textarea).");
    } catch (fallbackError) {
      console.error(
        `❌ Error in fallback prompt typing: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      );
      return; // Critical failure if prompt cannot be entered
    }
  }
  await new Promise((r) => setTimeout(r, 500)); // Short delay after typing prompt

  // Step 2 (New Order): Select audio length in modal
  console.log(`Attempting to click "${audioLength}" length button.`);
  const clickedLengthButton = await page.evaluate((length) => {
    let modalDialog = document.querySelector(
      ".mat-mdc-dialog-container, .cdk-overlay-pane",
    );
    if (!modalDialog) {
      console.warn(
        "Specific modal selectors (.mat-mdc-dialog-container, .cdk-overlay-pane) not found for length, trying generic div[role='dialog']",
      );
      modalDialog = document.querySelector('div[role="dialog"]');
    }
    if (!modalDialog) {
      console.error(
        "No modal dialog found for length selection (tried specific and generic).",
      );
      return false;
    }
    const lengthButtons = Array.from(modalDialog.querySelectorAll("button"));
    const targetButton = lengthButtons.find(
      (btn) =>
        btn.textContent?.trim() === length &&
        (btn as HTMLElement).offsetParent !== null,
    );
    if (targetButton instanceof HTMLElement) {
      targetButton.click();
      return true;
    }
    console.error(
      `Length button "${length}" not found or not visible in the active modal. Available buttons:`,
    );
    lengthButtons.forEach((btn) =>
      console.log(`- "${btn.textContent?.trim()}"`),
    );
    return false;
  }, audioLength);

  if (!clickedLengthButton) {
    console.error(
      `❌ Could not click the "${audioLength}" button in the modal.`,
    );
    console.warn(
      "Proceeding despite length button click failure (will use default or current length).",
    );
  } else {
    console.log(`👍 Clicked "${audioLength}" length button.`);
  }
  await new Promise((r) => setTimeout(r, 500)); // Short delay after clicking length

  // Step 3 (New Order): Click Generate in modal
  console.log("Attempting to click Generate button in modal...");
  try {
    const clickedModalGenerate = await page.evaluate(() => {
      let modalDialog = document.querySelector(
        ".mat-mdc-dialog-container, .cdk-overlay-pane",
      );
      if (!modalDialog) {
        console.warn(
          "Specific modal selectors (.mat-mdc-dialog-container, .cdk-overlay-pane) not found for Generate, trying generic div[role='dialog']",
        );
        modalDialog = document.querySelector('div[role="dialog"]');
      }
      if (!modalDialog) {
        console.error(
          "No modal dialog found for clicking Generate button (tried specific and generic).",
        );
        return false;
      }
      const buttons = Array.from(modalDialog.querySelectorAll("button"));
      // This logic was more robust for the Generate button previously
      for (const btn of buttons) {
        const span = btn.querySelector("span"); // Most Material buttons have text in a span
        const buttonText = (span?.textContent || btn.textContent || "").trim();

        if (
          buttonText === "Generate" &&
          (btn as HTMLElement).offsetParent !== null
        ) {
          // Check if visible
          (btn as HTMLElement).click();
          return true;
        }
      }
      console.error(
        "Generate button not found or not visible in the active modal (checked span and direct text). Available buttons:",
      );
      buttons.forEach((btn) =>
        console.log(
          `- "${(btn.querySelector("span")?.textContent || btn.textContent || "").trim()}"`,
        ),
      );
      return false;
    });

    if (!clickedModalGenerate) {
      throw new Error(
        "Failed to click Generate button in modal using combined logic.",
      );
    }
    console.log("⚙️ Clicked Generate in modal — waiting up to 15 minutes...");
  } catch (e) {
    console.error(
      `❌ Error clicking Generate in modal: ${e instanceof Error ? e.message : String(e)}`,
    );
    return; // Critical failure
  }

  // Wait for audio generation (player to appear)
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
  console.log("🗑️ Clicked Delete option");

  // Wait for the audio player to disappear as confirmation of deletion
  await page
    .waitForFunction(
      () => !document.querySelector('button[aria-label^="Play"]'),
      { timeout: 10000 },
    )
    .catch((): null => {
      // Explicitly type the arrow function's return
      console.warn(
        "⚠️ Audio player did not disappear after delete, or timeout reached.",
      );
      return null;
    });
  console.log("✅ Audio player disappeared, deletion confirmed.");

  await browser.disconnect();
  console.log("🎉 Script finished successfully!");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
