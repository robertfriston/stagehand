import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PROMPT = `GIVE ME THE INFORMATION BACK IN THIS SCHEMA:
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "YouTubeSource",
  "description": "Schema for a YouTube video source used in NotebookLM",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Title of the YouTube video"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the video content"
    },
    "questions": {
      "type": "array",
      "description": "List of questions generated from or related to the video",
      "items": {
        "type": "string"
      }
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Full URL of the YouTube video"
    },
    "channel": {
      "type": "string",
      "description": "Name of the YouTube channel that published the video"
    },
    "summary": {
      "type": "string",
      "description": "Short summary of the video content and key themes"
    }
  },
  "required": ["title", "description", "questions", "url", "channel", "summary"],
  "additionalProperties": false
}`;

async function run() {
  console.log("🚀 Starting NotebookLM Transcribe Sources Workflow...");
  let browser;
  try {
    console.log("🔗 Connecting to running Chrome instance...");
    browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
      protocolTimeout: 900000,
    });
    console.log("✅ Connected to Chrome");

    const notebookPage = (await browser.pages()).find((p) =>
      p.url().includes("notebooklm.google.com/notebook/"),
    );
    if (!notebookPage) {
      console.error(
        "❌ No NotebookLM tab found. Please open a notebook first.",
      );
      return;
    }
    console.log("📄 Found NotebookLM tab:", notebookPage.url());
    await notebookPage.bringToFront();

    // Find the chat textarea and paste the prompt
    console.log("📝 Pasting prompt into chat textarea...");
    const textareaSelector = "textarea";
    await notebookPage.waitForSelector(textareaSelector, { timeout: 15000 });
    const textarea = await notebookPage.$(textareaSelector);
    if (!textarea) {
      console.error("❌ Could not find chat textarea.");
      return;
    }
    await textarea.focus();
    await new Promise((r) => setTimeout(r, 3000));
    await textarea.click({ clickCount: 3 });
    await notebookPage.keyboard.press("Backspace");
    await new Promise((r) => setTimeout(r, 3000));
    // Directly set the value and dispatch input/change events
    await notebookPage.evaluate(
      (selector, prompt) => {
        const textarea = document.querySelector(
          selector,
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = prompt;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      textareaSelector,
      PROMPT,
    );
    await new Promise((r) => setTimeout(r, 3000));
    await notebookPage.keyboard.press("Enter");
    console.log("✅ Prompt submitted.");

    // Wait for the AI to respond
    console.log("⏳ Waiting 120 seconds for AI response...");
    await new Promise((r) => setTimeout(r, 120000));

    // Scroll to bottom and click the Copy to clipboard button
    console.log("🔽 Scrolling to bottom and clicking Copy to clipboard...");
    await notebookPage.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    );
    // Try to find the button by text or aria-label (using querySelectorAll and textContent)
    const copyButtonHandle = await notebookPage.evaluateHandle(() => {
      const buttons = Array.from(
        document.querySelectorAll('button, [role="button"]'),
      );
      return (
        buttons.find(
          (btn) =>
            btn.textContent &&
            btn.textContent.toLowerCase().includes("copy to clipboard"),
        ) || null
      );
    });
    if (!copyButtonHandle || !copyButtonHandle.asElement()) {
      console.error("❌ Could not find Copy to clipboard button.");
      return;
    }
    await (
      copyButtonHandle.asElement() as import("puppeteer-core").ElementHandle<Element>
    ).click();
    await copyButtonHandle.dispose();
    console.log("✅ Clicked Copy to clipboard.");

    // Read clipboard content from browser context
    console.log("📋 Reading clipboard content from browser clipboard...");
    const clipboardContent = await notebookPage.evaluate(async () => {
      // @ts-expect-error Puppeteer browser context may not have types for navigator.clipboard
      return await navigator.clipboard.readText();
    });
    let parsed;
    try {
      parsed = JSON.parse(clipboardContent);
    } catch (e) {
      console.error("❌ Failed to parse clipboard content as JSON:", e);
      return;
    }

    // Save to file
    const slotsDir = path.resolve(__dirname, "..", "..", "media", "slots");
    if (!fs.existsSync(slotsDir)) {
      fs.mkdirSync(slotsDir, { recursive: true });
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const slotFile = path.join(slotsDir, `slot-${timestamp}.json`);
    fs.writeFileSync(slotFile, JSON.stringify(parsed, null, 2), "utf-8");
    console.log(`✅ Saved results to: ${slotFile}`);
  } catch (error) {
    console.error(
      "❌ An error occurred during the transcription workflow:",
      error,
    );
  } finally {
    if (browser) {
      await browser.disconnect();
    }
    console.log("🎉 Transcription workflow finished.");
  }
}

run().catch((error) => {
  console.error("❌ An unexpected top-level error occurred:", error);
  process.exit(1);
});
