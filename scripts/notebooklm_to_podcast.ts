import puppeteer from "puppeteer-core";
import fs from "fs";

async function run() {
  console.log("🔌 Connecting to Chrome with remote debugging...");

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const notebookPage = pages.find((p) =>
    p.url().includes("notebooklm.google.com"),
  );

  if (!notebookPage) {
    console.error("❌ No open NotebookLM tab found.");
    return;
  }

  console.log("✅ Attached to NotebookLM tab");

  // Step 1: Find and click the "Generate" button
  const allButtons = await notebookPage.$$("button");
  let generateClicked = false;

  for (const btn of allButtons) {
    const text = await notebookPage.evaluate((el) => el.textContent, btn);
    if (text?.trim().toLowerCase() === "generate") {
      await btn.click();
      console.log("▶️ Clicked 'Generate' button.");
      generateClicked = true;
      break;
    }
  }

  if (!generateClicked) {
    console.error("❌ Could not find 'Generate' button.");
    return;
  }

  // Step 2: Wait for content to generate
  console.log("⏳ Waiting for NotebookLM to generate content...");
  await new Promise((res) => setTimeout(res, 10000));

  // Step 3: Extract visible div text
  const rawText = await notebookPage.$$eval("div", (divs) =>
    divs
      .map((div) => div.textContent?.trim() || "")
      .filter((t) => t.length > 50 && !t.includes("Audio Overview")),
  );

  const output = rawText.join("\n\n") || "❌ No usable content found.";
  console.log("📋 Output:\n", output);

  const outPath = "./output/notebooklm_podcast_script.txt";
  fs.mkdirSync("./output", { recursive: true });
  fs.writeFileSync(outPath, output);
  console.log(`✅ Saved podcast script to: ${outPath}`);
}

run().catch(console.error);
