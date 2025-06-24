import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { searchYouTube } from "../youtube-api";
const schemaPath = path.join(__dirname, "../notebook_schema_universal.json");
const PROMPT = fs.readFileSync(schemaPath, "utf-8");

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
    console.log("⏳ Waiting 180 seconds for AI response...");
    await new Promise((r) => setTimeout(r, 300000));

    // Scroll to bottom and click the Copy to clipboard button
    console.log(
      "🔽 Locating and clicking the last visible Copy to clipboard button...",
    );
    // Find all buttons with the correct aria-label, pick the last one, scroll it into view, and click
    const copyButtons = await notebookPage.$$(
      'button[aria-label="Copy model response to clipboard"]',
    );
    if (!copyButtons.length) {
      console.error("❌ Could not find Copy to clipboard button.");
      return;
    }
    const lastCopyButton = copyButtons[copyButtons.length - 1];
    await lastCopyButton.evaluate((btn) =>
      btn.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await new Promise((r) => setTimeout(r, 1000)); // Give time for scroll
    await lastCopyButton.click();
    console.log("✅ Clicked Copy to clipboard.");

    // Read clipboard content from browser context
    console.log("📋 Checking for clipboard permission dialog...");
    // Try to find and click the 'Allow' button if the clipboard permission dialog is present
    const allButtons = await notebookPage.$$("button");
    for (const btn of allButtons) {
      const text = await btn.evaluate((el) => el.textContent?.trim());
      if (text && text.toLowerCase() === "allow") {
        console.log(
          "🔓 Clipboard permission dialog detected. Clicking 'Allow'...",
        );
        await btn.click();
        await new Promise((r) => setTimeout(r, 1000));
        break;
      }
    }
    console.log("📋 Reading clipboard content from browser clipboard...");
    // Read raw clipboard content
    const clipboardContent = await notebookPage.evaluate(() => {
      return navigator.clipboard.readText();
    });
    console.log("🛠️ Debug: raw clipboard content:\n", clipboardContent);
    // Extract JSON array from any surrounding text
    let jsonString = clipboardContent;
    const firstBracket = jsonString.indexOf("[");
    const lastBracket = jsonString.lastIndexOf("]");
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      lastBracket > firstBracket
    ) {
      jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    }
    jsonString = jsonString.trim();
    console.log("🛠️ Debug: extracted JSON string:\n", jsonString);
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ Failed to parse extracted JSON string as JSON:", e);
      return;
    }
    // Fill missing URLs and channels using YouTube API
    console.log(
      "🔍 Enriching sources with YouTube API lookup for missing URLs...",
    );
    for (const item of parsed) {
      // Always search YouTube to get the canonical URL and video ID
      console.log(`  🔎 Searching YouTube for title: ${item.title}`);
      const result = await searchYouTube(item.title);
      if (result) {
        item.url = result.url;
        item.channel = result.channel;
        console.log(`    ✅ Found URL: ${item.url}`);
      } else {
        console.warn(`    ⚠️ No YouTube result for: ${item.title}`);
      }
    }

    // Convert watch URLs to embeddable URLs
    console.log("🔄 Converting YouTube URLs to embeddable format...");
    for (const item of parsed) {
      if (item.url && item.url.includes("watch?v=")) {
        const videoId = item.url.split("v=")[1];
        if (videoId) {
          const ampersandPosition = videoId.indexOf("&");
          const cleanVideoId =
            ampersandPosition !== -1
              ? videoId.substring(0, ampersandPosition)
              : videoId;
          item.url = `https://www.youtube.com/embed/${cleanVideoId}`;
          console.log(`  ✅ Converted URL for "${item.title}" to: ${item.url}`);
        }
      }
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

    // Update the master index file
    const indexFilePath = path.join(slotsDir, "index.json");
    let indexData = [];
    try {
      if (fs.existsSync(indexFilePath)) {
        const currentData = fs.readFileSync(indexFilePath, "utf-8");
        indexData = JSON.parse(currentData);
        if (!Array.isArray(indexData)) {
          console.warn("⚠️ index.json is not an array. Re-initializing.");
          indexData = [];
        }
      }
    } catch (e) {
      console.error("❌ Error reading or parsing index.json:", e);
      indexData = []; // Reset if there's an error
    }

    const newIndexEntry = {
      prompt:
        "Search the latest videos from the following YouTube channels: Jack Morgan RLP 2.0, Joshua Fluke, Labor Gains, Andy Thomas, A Life After Layoff, David Shapiro, After Skool, Tom Bilyeu, Large Man Abroad. Focus on content that explores the current state of the job market and how artificial intelligence is influencing hiring trends, displacing traditional roles, or creating new career opportunities.",
      slot_file: slotFile,
      created_at: new Date().toISOString(),
      count: parsed.length,
      params: {
        script: __filename,
        notebook_url: notebookPage.url(),
      },
    };

    indexData.push(newIndexEntry);
    fs.writeFileSync(
      indexFilePath,
      JSON.stringify(indexData, null, 2),
      "utf-8",
    );
    console.log(`✅ Updated index file at: ${indexFilePath}`);
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
