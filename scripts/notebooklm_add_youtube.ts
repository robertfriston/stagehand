import puppeteer from "puppeteer-core";

async function run() {
  const YOUTUBE_URL = "https://youtu.be/ns2Jxcy4Zbo?si=q6Ym-GFi_qpOEAYo";
  const WAIT_FOR_LOGIN_MS = 60000; // 1 minute

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
  await (addButtonHandle as any).click();
  console.log("✅ [Step 4] Clicked [+ Add] button");

  // Wait for modal to appear
  console.log("⏳ [Step 5] Waiting for modal to appear...");
  await page.waitForSelector(
    "div[role='dialog'], .mat-mdc-dialog-container, .cdk-overlay-pane",
    { timeout: 10000 },
  );
  console.log("✅ [Step 5] Modal appeared");

  // Step 6: Click [YouTube] button in modal
  console.log("🔍 [Step 6] Looking for [YouTube] button in modal...");
  const youtubeButtonHandle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find(
        (btn) => btn.textContent && btn.textContent.includes("YouTube"),
      ) || null
    );
  });
  if (!youtubeButtonHandle) {
    console.error("❌ [YouTube] button not found in modal");
    await browser.disconnect();
    return;
  }
  await (youtubeButtonHandle as any).click();
  console.log("✅ [Step 6] Clicked [YouTube] button");

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
  await (insertButtonHandle as any).click();
  console.log("✅ [Step 9] Clicked [Insert] button");

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
