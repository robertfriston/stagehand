import puppeteer from "puppeteer-core";

async function run() {
  console.log("🛠️ Running in mode: debug3");
  console.log("🔁 Launching Chrome...");
  console.log("🌐 Opening Notebook...");
  console.log("🎯 Target: Discover button in NotebookLM Sources tab");

  // Connect to Chrome
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
    protocolTimeout: 900000,
  });
  console.log("✅ Connected to Chrome");

  // Find the NotebookLM tab
  const pages = await browser.pages();
  const notebookPages = pages.filter((p) =>
    p.url().includes("notebooklm.google.com/notebook/"),
  );
  if (notebookPages.length === 0) {
    console.error("❌ No NotebookLM tab found");
    await browser.disconnect();
    return;
  }
  const page = notebookPages[notebookPages.length - 1];
  console.log("🔎 Using NotebookLM tab with URL:", page.url());
  await page.bringToFront();
  console.log("✅ Brought NotebookLM tab to front");

  // Wait for the Discover button to be visible
  console.log("🔍 Looking for Discover button...");
  try {
    await page.waitForSelector("button span.mat-mdc-button-touch-target", {
      timeout: 10000,
    });
    // Find the button with label Discover
    const discoverButton = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return (
        btns.find(
          (btn) =>
            btn.textContent &&
            btn.textContent.trim().includes("Discover") &&
            (btn as HTMLElement).offsetParent !== null,
        ) || null
      );
    });
    if (!discoverButton) {
      console.error("❌ Discover button not found");
      await browser.disconnect();
      return;
    }
    const discoverElem =
      discoverButton.asElement() as import("puppeteer-core").ElementHandle<Element>;
    if (discoverElem) {
      await discoverElem.click();
      await discoverButton.dispose();
      console.log("✅ Clicked Discover button");

      // Wait for the Discover sources modal and textarea to appear
      console.log("⏳ Waiting for Discover sources modal and textarea...");
      const DISCOVER_PROMPT =
        "Find the latest YouTube videos that explore the current Job Market an the influence of A.I.";
      // Modal selectors as in other workflows
      const modalSelectors = [
        'div[role="dialog"]',
        ".mat-mdc-dialog-container",
        ".cdk-overlay-pane",
      ];
      let modal = null;
      for (const sel of modalSelectors) {
        await page.waitForSelector(sel, { timeout: 5000 }).catch(() => {});
        const handles = await page.$$(sel);
        for (const handle of handles) {
          const visible = await handle.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return (
              style &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              (el as HTMLElement).offsetParent !== null
            );
          });
          if (visible) {
            modal = handle;
            break;
          }
        }
        if (modal) break;
      }
      if (!modal) {
        console.error("❌ No visible Discover sources modal found");
        await browser.disconnect();
        return;
      }
      // Find the textarea inside the visible modal
      const textarea = await modal.$("textarea");
      if (!textarea) {
        console.error(
          "❌ Discover sources textarea not found inside visible modal",
        );
        await browser.disconnect();
        return;
      }
      // Wait 3 seconds before pasting
      await new Promise((r) => setTimeout(r, 3000));
      await textarea.focus();
      await textarea.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await textarea.type(DISCOVER_PROMPT, { delay: 30 });
      // Trigger input/change events
      await page.evaluate(
        (el, value) => {
          (el as HTMLTextAreaElement).value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        },
        textarea,
        DISCOVER_PROMPT,
      );
      // Wait 3 seconds after pasting
      await new Promise((r) => setTimeout(r, 3000));
      console.log(
        "✅ Pasted prompt and triggered input/change events in Discover sources textarea",
      );

      // Click the Submit button in the modal
      const submitButton = await modal.$('button, [role="button"]');
      if (submitButton) {
        // Find the button with text 'Submit' (case-insensitive)
        const btnText = await submitButton.evaluate((el) =>
          el.textContent?.trim().toLowerCase(),
        );
        if (btnText && btnText.includes("submit")) {
          await submitButton.click();
          console.log("✅ Clicked Submit button in Discover sources modal");
        } else {
          // If the first button isn't Submit, search all buttons in the modal
          const allButtons = await modal.$$('button, [role="button"]');
          let clicked = false;
          for (const btn of allButtons) {
            const text = await btn.evaluate((el) =>
              el.textContent?.trim().toLowerCase(),
            );
            if (text && text.includes("submit")) {
              await btn.click();
              clicked = true;
              console.log("✅ Clicked Submit button in Discover sources modal");
              break;
            }
          }
          if (!clicked) {
            console.error(
              "❌ Submit button not found in Discover sources modal",
            );
          }
        }
      } else {
        console.error("❌ No button found in Discover sources modal");
      }

      // Wait 60 seconds before clicking Import
      console.log(
        "⏳ Waiting 60 seconds for sources to load before clicking Import...",
      );
      await new Promise((r) => setTimeout(r, 60000));

      // Find and click the Import button in the modal
      const importButtons = await modal.$$('button, [role="button"]');
      let importClicked = false;
      for (const btn of importButtons) {
        const text = await btn.evaluate((el) =>
          el.textContent?.trim().toLowerCase(),
        );
        if (text && text.includes("import")) {
          await btn.click();
          importClicked = true;
          console.log("✅ Clicked Import button in Discover sources modal");
          break;
        }
      }
      if (!importClicked) {
        console.error("❌ Import button not found in Discover sources modal");
      }
    } else {
      console.error("❌ Discover button handle is not an element");
      await browser.disconnect();
      return;
    }
  } catch (e) {
    console.error("❌ Error finding or clicking Discover button:", e);
    await browser.disconnect();
    return;
  }

  // Done
  await browser.disconnect();
  console.log("🎉 Discover button click complete. Script finished.");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
