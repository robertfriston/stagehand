// scripts/helloDashboard.ts
import { Stagehand } from "../dist/index.js";
import dotenv from "dotenv"; // Ensure @types/dotenv is installed

// Load environment variables from .env file
// This should be called early, before process.env is accessed extensively.
dotenv.config();

async function run() {
  const sh = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    localBrowserLaunchOptions: {
      headless: false,
      slowMo: 250, // small slow‑mo so you can see each step
    },
  });
  await sh.init();
  const page = sh.page;

  // --- Configuration ---
  // Ensure @types/node provides definitions for process.env
  const targetEnvironment = "LOCAL"; // Switch between 'LOCAL' and 'REMOTE'
  const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login"; // Use ?? for nullish coalescing
  const remoteUrl =
    process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login"; // Use ?? for nullish coalescing
  const targetUrl = targetEnvironment === "LOCAL" ? localUrl : remoteUrl;

  // Set timeout based on environment
  const defaultTimeout = targetEnvironment === "REMOTE" ? 2000 : 2000;
  // --- End Configuration ---

  // 1) Go to login and sign in
  await page.waitForTimeout(2000);

  // Use the configured target URL
  console.log(`Navigating to: ${targetUrl}`); // Add log for debugging
  await page.goto(targetUrl);

  // Loop through the workflow twice
  for (let i = 0; i < 2; i++) {
    console.log(`Starting workflow iteration ${i + 1}`);

    //================
    //PHASE ONE

    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").fill("test");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").fill("user");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").fill("test.user@jobenvy.co.uk");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(defaultTimeout);

    //DEPENDS ON IF ALREADY SINGUP
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout);

    //THIS CAN FAIL TO SWITCH THE TAB BACK - Wrap in try/catch
    try {
      await page.getByTestId("login").click();
      console.log("Clicked login tab/button successfully.");
    } catch (error) {
      console.warn(
        "Could not click login tab/button, continuing execution:",
        error.message,
      );
      // Optional: Add specific checks or alternative actions if needed
    }

    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("test.user@jobenvy.co.uk");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("profile").getByText("Profile").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").press("ArrowRight");
    await page.waitForTimeout(defaultTimeout);

    // Fill in the first name with a timestamp and environment indicator
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const environmentLabel = i === 0 ? "LOCAL" : "STAGING"; // Determine label based on iteration
    const nameWithTimestamp = `Test ${environmentLabel} [${timestamp}]`; // Construct the name
    await page.getByTestId("firstNamesString").fill(nameWithTimestamp);
    await page.waitForTimeout(defaultTimeout);

    await page.getByTestId("done").getByTestId("iconIcon").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("MASTER RESUME").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("profile").getByText("Profile").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("delete_account").click();
    await page.waitForTimeout(defaultTimeout);
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole("button", { name: "OK" }).click();

    if (i == 1) {
      //staging only
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Staging").click();
      await page.waitForTimeout(defaultTimeout);
    }

    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").fill("test");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").fill("user");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").fill("test.user@jobenvy.co.uk");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("test.user@jobenvy.co.uk");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .locator(
        "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
      )
      .first()
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.locator("img").click();
    await page.waitForTimeout(defaultTimeout);

    //CHATBOT
    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill("hi - help me update my master resume");
    await page.waitForTimeout(5000);
    await page.getByText("").click();
    await page.waitForTimeout(5000);
    await page.getByText("Close Your Agent").click();
    //===================

    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.locator("img").first().click();
    await page.waitForTimeout(defaultTimeout);

    //CHATBOT
    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(5000);
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill(
        "what is the job situation like in Brighton UK for software engineering roles?",
      );
    await page.waitForTimeout(5000);
    await page.getByText("").click();
    await page.waitForTimeout(5000);
    await page.waitForTimeout(5000);
    await page.waitForTimeout(5000);
    await page.getByText("Close Your Agent").click();
    await page.waitForTimeout(defaultTimeout);
    //===================

    //================
    //PHASE TWO

    await page.goto("http://localhost:3000/dashboard/jobseeker/");
    await page.waitForTimeout(defaultTimeout);

    await page
      .locator("div")
      .filter({ hasText: /^MASTER RESUME90% Complete$/ })
      .getByTestId("listItemTitle")
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("").nth(1).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("resume", { exact: true }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("portfolio").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("add_jobrole").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("addNew").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("addNew").fill("Test Resume");
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Your Profiles").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("listItem_0").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("done").getByTestId("iconIcon").click();
    await page.waitForTimeout(defaultTimeout);
    await page.locator("span").filter({ hasText: "Test Resume" }).click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .locator("div")
      .filter({ hasText: /^Not Assigned$/ })
      .nth(3)
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .locator(
        "div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div > div > div > div > div",
      )
      .first()
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("jobTitle").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("jobTitle").fill("Test Job Title");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("headerContainer").getByTestId("iconIcon").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("cv").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Curriculum Vitae", { exact: true }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Summary").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("summary").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("summary").fill("Test Summary");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("headerContainer").getByTestId("iconIcon").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("left_nav_button").getByText("Home").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "log out" }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout);

    if (i == 1) {
      //staging only
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Staging").click();
      await page.waitForTimeout(defaultTimeout);
    }

    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click();
    await page.waitForTimeout(defaultTimeout);

    // If it's the first iteration, click Staging and prepare for the second run
    if (i === 0) {
      console.log(
        "First iteration complete. Clicking Staging and logging in again.",
      );

      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("left_nav_button").getByText("Home").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByRole("button", { name: "log out" }).click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByRole("button", { name: "OK" }).click();

      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Staging").click();
      await page.waitForTimeout(defaultTimeout);
    } else {
      console.log("Second iteration complete.");
    }
  }

  console.log("Workflow completed twice. Pausing.");
  await page.pause();

  // await sh.close();  // re‑enable when you’re ready to auto‑close
}

run().catch(console.error);
