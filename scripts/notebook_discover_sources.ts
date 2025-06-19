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
      try {
        // Wait for the modal to appear (role=dialog or class contains dialog)
        const modalSelectors = [
          'div[role="dialog"]',
          ".mat-mdc-dialog-container",
          ".cdk-overlay-pane",
        ];
        let modal = null;
        for (const sel of modalSelectors) {
          await page.waitForSelector(sel, { timeout: 10000 });
          const handles = await page.$$(sel);
          for (const handle of handles) {
            const visible = await handle.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return (
                style &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0"
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
        } else {
          // Wait for textarea inside the visible modal
          const textarea = await modal.$("textarea");
          if (textarea) {
            // Add a 3 second delay before pasting
            await new Promise((r) => setTimeout(r, 3000));
            await textarea.focus();
            await textarea.click({ clickCount: 3 }); // Select all
            await page.keyboard.press("Backspace"); // Clear
            await textarea.type(
              "Find the latest YouTube videos that explore the current Job Market an the influence of A.I.",
              { delay: 30 },
            );
            // Trigger input/change events to ensure UI updates
            await page.evaluate(
              (el, value) => {
                (el as HTMLTextAreaElement).value = value;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              },
              textarea,
              "Find the latest YouTube videos that explore the current Job Market an the influence of A.I.",
            );
            // Add a 3 second delay after pasting
            await new Promise((r) => setTimeout(r, 3000));
            console.log(
              "✅ Pasted prompt and triggered input/change events in Discover sources textarea",
            );
          } else {
            console.error(
              "❌ Discover sources textarea not found inside visible modal",
            );
          }
        }
      } catch (e) {
        console.error(
          "❌ Error finding or typing in Discover sources textarea:",
          e,
        );
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
