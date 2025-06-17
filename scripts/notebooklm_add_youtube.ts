import puppeteer from "puppeteer-core";

async function run() {
  const YOUTUBE_URL = "https://youtu.be/ns2Jxcy4Zbo?si=q6Ym-GFi_qpOEAYo";
  const WAIT_FOR_LOGIN_MS = 10000; // 1 minute

  console.log("⏳ [Step 1] Waiting for Google login...");
  await new Promise((r) => setTimeout(r, WAIT_FOR_LOGIN_MS));
  console.log("⏩ [Step 1] Done waiting for login");

  console.log("🎙️ [Step 2] Connecting to Chrome...");
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
    protocolTimeout: 900000,
  });
  console.log("✅ [Step 2] Connected to Chrome");

  // Find all tabs, pick the last NotebookLM tab
  console.log("🔎 [Step 3] Searching for NotebookLM tabs...");
  const pages = await browser.pages();
  console.log(`🔎 [Step 3] Found ${pages.length} total tabs`);
  const notebookPages = pages.filter((p) =>
    p.url().includes("notebooklm.google.com/notebook/"),
  );
  console.log(`🔎 [Step 3] Found ${notebookPages.length} NotebookLM tabs`);
  if (notebookPages.length === 0) {
    console.error("❌ No NotebookLM tab found");
    await browser.disconnect();
    return;
  }
  const page = notebookPages[notebookPages.length - 1];
  console.log("🔎 [Step 3] Using NotebookLM tab with URL:", page.url());
  await page.bringToFront();
  console.log("✅ [Step 3] Brought NotebookLM tab to front");

  // Step 4: Click [+ Add] under Sources
  console.log("🔍 [Step 4] Looking for [+ Add] button under Sources...");
  const addButtonHandle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find(
        (btn) => btn.textContent && btn.textContent.trim().includes("Add"),
      ) || null
    );
  });
  if (!addButtonHandle) {
    console.error("❌ [+ Add] button not found");
    await browser.disconnect();
    return;
  }
  const addButtonElem =
    addButtonHandle.asElement() as import("puppeteer-core").ElementHandle<Element>;
  if (addButtonElem) {
    await addButtonElem.click();
    await addButtonHandle.dispose();
    console.log("✅ [Step 4] Clicked [+ Add] button");
    await new Promise((r) => setTimeout(r, 3000)); // 3 second delay
  } else {
    console.error("❌ [+ Add] button handle is not an element");
    await browser.disconnect();
    return;
  }

  // Wait for modal to appear
  console.log("⏳ [Step 5] Waiting for modal to appear...");
  await page.waitForSelector(
    "div[role='dialog'], .mat-mdc-dialog-container, .cdk-overlay-pane",
    { timeout: 10000 },
  );
  console.log("✅ [Step 5] Modal appeared");

  // Wait a bit longer after modal appears
  await new Promise((r) => setTimeout(r, 2000));

  // Get all button texts in the modal and log them in Node.js
  const modalButtonTexts = await page.evaluate(() => {
    let modalDialog = document.querySelector(
      ".mat-mdc-dialog-container, .cdk-overlay-pane",
    );
    if (!modalDialog) {
      modalDialog = document.querySelector('div[role="dialog"]');
    }
    if (modalDialog) {
      const buttons = Array.from(modalDialog.querySelectorAll("button"));
      return buttons.map((btn, i) => `[${i}] "${btn.textContent?.trim()}"`);
    }
    return ["No modal dialog found for button logging."];
  });
  console.log("Modal buttons:", modalButtonTexts);

  // Find and log all visible buttons with their text
  const allButtonTexts = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons
      .filter((btn) => btn.offsetParent !== null)
      .map((btn, i) => `[${i}] "${btn.textContent?.trim()}"`);
  });
  console.log("All visible buttons:", allButtonTexts);

  // Step 6: Click [YouTube] icon button in document
  console.log("🔍 [Step 6] Looking for [YouTube] icon button in document...");
  const clickedYouTube = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const ytBtn = buttons.find(
      (btn) =>
        btn.offsetParent !== null &&
        btn.textContent &&
        btn.textContent.includes("video_youtube"),
    );
    if (ytBtn instanceof HTMLElement) {
      ytBtn.click();
      return true;
    }
    return false;
  });
  if (!clickedYouTube) {
    console.error("❌ [YouTube] icon button not found in document");
    await browser.disconnect();
    return;
  }
  console.log("✅ [Step 6] Clicked [YouTube] icon button");
  await new Promise((r) => setTimeout(r, 3000)); // 3 second delay

  // Wait for YouTube URL input to appear
  console.log("⏳ [Step 7] Waiting for YouTube URL input to appear...");
  await page.waitForSelector("input[type='text'], input", { timeout: 10000 });
  console.log("✅ [Step 7] YouTube URL input appeared");

  // Step 8: Paste YouTube URL
  console.log("✍️ [Step 8] Pasting YouTube URL...");
  const input = await page.$("input[type='text'], input");
  if (!input) {
    console.error("❌ YouTube URL input field not found");
    await browser.disconnect();
    return;
  }
  await input.click({ clickCount: 3 });
  await input.type(YOUTUBE_URL, { delay: 10 });
  console.log("✅ [Step 8] Pasted YouTube URL");

  // Step 9: Click [Insert] button
  console.log("🔍 [Step 9] Looking for [Insert] button...");
  const insertButtonHandle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find(
        (btn) => btn.textContent && btn.textContent.includes("Insert"),
      ) || null
    );
  });
  if (!insertButtonHandle) {
    console.error("❌ [Insert] button not found");
    await browser.disconnect();
    return;
  }
  const insertButtonElem =
    insertButtonHandle.asElement() as import("puppeteer-core").ElementHandle<Element>;
  if (insertButtonElem) {
    await insertButtonElem.click();
    await insertButtonHandle.dispose();
    console.log("✅ [Step 9] Clicked [Insert] button");
    await new Promise((r) => setTimeout(r, 3000)); // 3 second delay
  } else {
    console.error("❌ [Insert] button handle is not an element");
    await browser.disconnect();
    return;
  }

  // Optional: Wait for the modal to close or for the new source to appear
  console.log(
    "⏳ [Step 10] Waiting for modal to close or new source to appear...",
  );
  await new Promise((r) => setTimeout(r, 2000));
  console.log("✅ [Step 10] Done waiting");

  await browser.disconnect();
  console.log("🎉 [Step 11] YouTube source added successfully!");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
