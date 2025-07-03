import puppeteer from "puppeteer-core";
import fs from "fs";

async function run() {
  // Load persona config and extract discover prompts
  const personaPath = process.env.PERSONA_JSON;
  if (!personaPath) throw new Error("PERSONA_JSON env var not set");
  console.log("DEBUG: Loading persona config from", personaPath);
  const configRaw = fs.readFileSync(personaPath, "utf-8");
  const config = JSON.parse(configRaw);
  const notebookUrls = Object.keys(config.prompts);
  if (notebookUrls.length === 0)
    throw new Error("No NotebookLM URLs found in config.");
  const notebookUrl = process.env.NOTEBOOK_URL ?? notebookUrls[0];
  const notebookMeta = config.prompts[notebookUrl];
  console.log("DEBUG: Notebook metadata", notebookMeta);
  const discoverPrompts = notebookMeta?.discover;
  if (!Array.isArray(discoverPrompts) || discoverPrompts.length === 0)
    throw new Error("No discover prompts found in config.");
  // Print a unique marker from the persona file for debug
  if (config.last_updated) {
    console.log("DEBUG: Persona last_updated:", config.last_updated);
  }

  for (const [i, DISCOVER_PROMPT] of discoverPrompts.entries()) {
    console.log(
      `\n🔁 [${i + 1}/${discoverPrompts.length}] Running discover prompt: ${DISCOVER_PROMPT}`,
    );
    // ...existing code...
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
      continue;
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
        continue;
      }
      const discoverElem =
        discoverButton.asElement() as import("puppeteer-core").ElementHandle<Element>;
      if (discoverElem) {
        await discoverElem.click();
        await discoverButton.dispose();
        console.log("✅ Clicked Discover button");

        // Wait for the Discover sources modal and textarea to appear
        console.log("⏳ Waiting for Discover sources modal and textarea...");

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
          continue;
        }
        // Find the textarea inside the visible modal
        const textarea = await modal.$("textarea");
        if (!textarea) {
          console.error(
            "❌ Discover sources textarea not found inside visible modal",
          );
          await browser.disconnect();
          continue;
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
                console.log(
                  "✅ Clicked Submit button in Discover sources modal",
                );
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

        // --- Now click Import as before ---
        // Uncheck all sources that are NOT YouTube videos (wait 3s between each)
        console.log("🔍 Unchecking all non-YouTube sources before Import...");
        let unchecked;
        do {
          unchecked = false;
          const sourceItems = await modal.$$(".source-item");
          for (const item of sourceItems) {
            const isYouTube = await item.evaluate((el) => {
              const icon = el.querySelector(
                "svg, .mat-icon, .mat-icon-no-color, .source-icon",
              );
              if (
                icon &&
                icon.textContent &&
                icon.textContent.toLowerCase().includes("youtube")
              )
                return true;
              return (
                el.textContent &&
                el.textContent.toLowerCase().includes("youtube")
              );
            });
            if (!isYouTube) {
              const checkbox = await item.$('input[type="checkbox"]');
              if (checkbox) {
                const checked = await checkbox.evaluate(
                  (el) => (el as HTMLInputElement).checked,
                );
                if (checked) {
                  await checkbox.click();
                  console.log("☑️ Unchecked non-YouTube source");
                  await new Promise((r) => setTimeout(r, 3000));
                  unchecked = true;
                  break; // DOM may update, so restart the loop
                }
              }
            }
          }
        } while (unchecked);

        // --- Now click Import as before ---
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
        continue;
      }
    } catch (e) {
      console.error("❌ Error finding or clicking Discover button:", e);
      await browser.disconnect();
      continue;
    }

    // Done with this prompt
    await browser.disconnect();
    console.log(
      `🎉 Discover prompt [${i + 1}] complete. Waiting 60 seconds before next if any...`,
    );
    if (i < discoverPrompts.length - 1) {
      await new Promise((r) => setTimeout(r, 60000));
    }
  }
  console.log("🎉 All discover prompts complete. Script finished.");
}

run().catch((error) => {
  console.error("❌ An error occurred:", error);
  process.exit(1);
});
