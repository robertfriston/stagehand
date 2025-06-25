// Unified JSON extraction and parsing utility for all podcast workflows
// Usage: import { extractAndParseJsonFromClipboard } from './jsonExtractor';

import { Page } from "puppeteer-core";
export async function extractAndParseJsonFromClipboard(
  notebookPage: Page,
): Promise<any[] | null> {
  // Read raw clipboard content
  const clipboardContent = await notebookPage.evaluate(() => {
    return navigator.clipboard.readText();
  });
  console.log("🛠️ Debug: raw clipboard content:\n", clipboardContent);

  // Remove code fences if present
  let jsonString = clipboardContent.replace(/```json|```/g, "").trim();

  // Try to extract the first JSON array or object
  // Use a less strict regex for compatibility (no /s flag)
  const match = jsonString.match(/(\[([\s\S]*)\]|\{([\s\S]*)\})/);
  if (match) jsonString = match[0];

  // Fallback: bracket extraction (legacy)
  const firstBracket = jsonString.indexOf("[");
  const lastBracket = jsonString.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    jsonString = jsonString.substring(firstBracket, lastBracket + 1);
  }
  jsonString = jsonString.trim();

  // Remove trailing commas before closing brackets (common JSON copy error)
  jsonString = jsonString.replace(/,\s*([\]}])/g, "$1");

  // Attempt to auto-close missing bracket if array/object is unterminated
  if (
    (jsonString.match(/\[/g) || []).length >
    (jsonString.match(/\]/g) || []).length
  ) {
    jsonString += "]";
  }
  if (
    (jsonString.match(/\{/g) || []).length >
    (jsonString.match(/\}/g) || []).length
  ) {
    jsonString += "}";
  }

  console.log("🛠️ Debug: extracted JSON string:\n", jsonString);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ Failed to parse extracted JSON string as JSON:", e);
    console.error("Raw extracted string:", jsonString);
    return null;
  }
}
