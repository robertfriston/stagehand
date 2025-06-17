import puppeteer, { Page } from "puppeteer-core"; // Import Page

// Helper function to print visible buttons in a modal
async function printVisibleButtons(page: Page, modalSelector: string) {
  // Use Page type
  console.log(`Attempting to log visible buttons in modal: ${modalSelector}`);
  const modalButtonDebugInfo = await page.evaluate((selector: string) => {
    // Add type for selector
    const modal = document.querySelector(selector);
    if (!modal) {
      return {
        error: `Modal not found with selector: ${selector}`,
        buttons: [] as string[],
      }; // Add type for buttons
    }
    const buttons = Array.from(
      modal.querySelectorAll(
        'button, div[role="button"], input[type="button"], input[type="submit"]',
      ),
    );
    const visibleButtons = buttons.filter((btn) => {
      const el = btn as HTMLElement;
      return (
        el.offsetParent !== null &&
        !el.hidden &&
        el.style.display !== "none" &&
        el.style.visibility !== "hidden"
      );
    });
    return {
      error: null,
      buttons: visibleButtons.map((btn, i) => {
        const el = btn as HTMLElement;
        return `[${i}] Text: "${(el.textContent || el.innerText || (el as HTMLInputElement).value || el.getAttribute("aria-label") || "").trim()}", HTML: ${el.outerHTML.substring(0, 100)}`;
      }),
    };
  }, modalSelector);

  if (modalButtonDebugInfo.error) {
    console.error(
      `Error in printVisibleButtons: ${modalButtonDebugInfo.error}`,
    );
  } else if (modalButtonDebugInfo.buttons.length === 0) {
    console.log(`No visible buttons found in modal ${modalSelector}.`);
  } else {
    console.log(`Visible buttons in modal ${modalSelector}:`);
    modalButtonDebugInfo.buttons.forEach((btnInfo: string) =>
      console.log(btnInfo),
    ); // Add type for btnInfo
  }
}

async function run() {
  const YOUTUBE_URL = "https://youtu.be/ns2Jxcy4Zbo?si=q6Ym-GFi_qpOEAYo";
  const YOUTUBE_TITLE =
    "TOP 5 Most Cringy Job Postings On The Internet - My Reaction!"; // Optional, if needed for further processing

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
  console.log("🔍 [Step 6] Looking for [YouTube] button/chip in modal...");
  const clickedYouTubeResult = await page.evaluate(() => {
    const modalSelectors = [
      ".mat-mdc-dialog-container",
      ".cdk-overlay-pane",
      "div[role='dialog']",
    ];
    let searchContext: ParentNode = document; // Default to document

    for (const selector of modalSelectors) {
      const modal = document.querySelector(selector);
      if (modal) {
        searchContext = modal;
        // console.log(`YouTube button search context set to modal: ${selector}`);
        break;
      }
    }
    if (searchContext === document) {
      // console.warn("Modal not found for YouTube button search, searching entire document.");
    }

    const potentialElements = Array.from(
      searchContext.querySelectorAll('mat-chip, button, [role="button"]'),
    );

    for (const el of potentialElements) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.offsetParent === null) continue; // Check for visibility

      const textContent = (el.textContent || "").trim().toLowerCase();
      const innerText = (el.innerText || "").trim().toLowerCase();

      // Prioritize checking for the specific span structure from the screenshot
      const specificTextSpan = el.querySelector(
        "span.mdc-evolution-chip_text-label span",
      );
      if (
        specificTextSpan &&
        (specificTextSpan.textContent || "").trim().toLowerCase() === "youtube"
      ) {
        el.click();
        return { success: true, foundWith: "specific span text 'YouTube'" };
      }

      // Fallback to broader text search if specific span not found or doesn't match
      if (
        textContent.includes("youtube") ||
        innerText.includes("youtube") ||
        textContent.includes("video_youtube") ||
        innerText.includes("video_youtube")
      ) {
        el.click();
        return {
          success: true,
          foundWith: `general text/icon content (e.g., '${textContent || innerText}')`,
        };
      }
    }
    return { success: false, foundWith: null };
  });

  if (!clickedYouTubeResult.success) {
    console.error(
      `❌ [YouTube] button/chip not found. Debug info: ${clickedYouTubeResult.foundWith || "No specific element matched criteria."}`,
    );
    const modalSelectorForDebug =
      "div[role='dialog'], .mat-mdc-dialog-container, .cdk-overlay-pane";
    // Ensure printVisibleButtons is effective by checking if a modal is actually found by its selector.
    const modalExistsForDebug = await page.evaluate(
      (sel) => !!document.querySelector(sel),
      modalSelectorForDebug,
    );
    if (modalExistsForDebug) {
      console.log(
        "Modal detected for debug logging. Logging visible buttons within it...",
      );
      await printVisibleButtons(page, modalSelectorForDebug);
    } else {
      console.log(
        "No modal detected with standard selectors for debug logging. The YouTube button might be outside a recognized modal or the modal structure changed.",
      );
    }
    await browser.disconnect();
    return;
  }
  console.log(
    `✅ [Step 6] Clicked [YouTube] button/chip. Found via: ${clickedYouTubeResult.foundWith}`,
  );
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
  let insertButtonSuccess = false;
  if (insertButtonElem) {
    await insertButtonElem.click();
    await insertButtonHandle.dispose();
    console.log("✅ [Step 9] Clicked [Insert] button");
    await new Promise((r) => setTimeout(r, 3000)); // 3 second delay
    insertButtonSuccess = true;
  } else {
    console.error("❌ [Insert] button handle is not an element");
    await browser.disconnect();
    return;
  }

  if (!insertButtonSuccess) {
    console.log(
      'Initial attempt to click "Insert" failed. Trying alternative strategy using page.evaluate...',
    );

    const modalSelector =
      "div[role='dialog'], .mat-mdc-dialog-container, .cdk-overlay-pane"; // Define modalSelector here
    const evaluationResult = await page.evaluate(
      (modalDialogSelector, targetButtonText) => {
        const modal = document.querySelector(modalDialogSelector);
        if (!modal) {
          return {
            success: false,
            message: `Modal not found with selector: ${modalDialogSelector}`,
          };
        }
        const buttons = Array.from(
          modal.querySelectorAll(
            'button, div[role="button"], input[type="button"], input[type="submit"]',
          ),
        );

        for (const btn of buttons) {
          const el = btn as HTMLElement;
          // Basic visibility check: element must be part of the offset hierarchy
          if (
            el.offsetParent === null ||
            el.hidden ||
            el.style.display === "none" ||
            el.style.visibility === "hidden"
          ) {
            continue;
          }

          const textContent = (el.textContent || "").trim();
          const innerTextVal = (el.innerText || "").trim(); // innerText considers CSS visibility to some extent
          const ariaLabel = (el.getAttribute("aria-label") || "").trim();
          const value = ((el as HTMLInputElement).value || "").trim();

          const textsToSearch = [
            textContent,
            innerTextVal,
            ariaLabel,
            value,
          ].filter((s) => s && s.length > 0);

          for (const text of textsToSearch) {
            if (text.toLowerCase().includes(targetButtonText.toLowerCase())) {
              el.click();
              return {
                success: true,
                message: `Clicked button with text/label containing "${targetButtonText}" (found: "${text}")`,
              };
            }
          }
        }
        return {
          success: false,
          message: `No visible button containing "${targetButtonText}" found in modal ${modalDialogSelector}`,
        };
      },
      modalSelector,
      "Insert",
    );

    if (evaluationResult.success) {
      console.log(
        `Successfully clicked the "Insert" button using alternative strategy: ${evaluationResult.message}`,
      );
      insertButtonSuccess = true;
    } else {
      console.error(
        `Failed to click the "Insert" button using alternative strategy. ${evaluationResult.message}`,
      );
      // Log visible buttons again if the evaluate strategy also fails, as it might provide new clues
      await printVisibleButtons(page, modalSelector);
    }
  } else {
    console.log(
      'Successfully clicked the "Insert" button on the first attempt (using clickButtonByTextOrIcon).',
    );
  }

  if (insertButtonSuccess) {
    await new Promise((r) => setTimeout(r, 5000)); // Increased wait for action to complete and source to be processed
    console.log("YouTube source should now be added. Verify in NotebookLM.");
  } else {
    console.error(
      'CRITICAL: FAILED TO ADD YOUTUBE SOURCE. The "Insert" button could not be clicked.',
    );
    throw new Error(
      "Failed to click the Insert button in the YouTube modal after multiple attempts.",
    );
  }

  console.log("Waiting for 5 seconds before closing browser...");
  await new Promise((r) => setTimeout(r, 5000)); // Replace page.waitForTimeout

  await browser.disconnect();
  console.log("🎉 [Step 11] YouTube source added successfully!");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
