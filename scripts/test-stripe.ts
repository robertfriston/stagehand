// scripts/helloDashboard.ts
import { Stagehand } from "../dist/index.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const userCredentials = {
  firstname: "test",
  lastname: "user", // Unique last name for this workflow
  email: "test.user@jobenvy.co.uk", // Unique email
  username: "testuser", // Unique username
  password: "testuser",
};
const defaultTimeout = 2000; // Use the same timeout logic as helloDashboard for exact replication
// --- End Configuration ---

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

  // 1) Go to login and sign in (you already have this working)
  //await page.goto("http://localhost:3000/");
  //await page.waitForTimeout(2000);

  await page.goto("http://localhost:3000/login");

  // Unconditional login attempt (matches helloDashboard's structure)
  await page.getByTestId("username").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("username").fill(userCredentials.username); // Use username from credentials
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("password").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("password").fill(userCredentials.password);
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("seek").click(); // Login button
  await page.waitForTimeout(defaultTimeout);

  // Logout - Match helloDashboard
  await page.getByTestId("left_nav_button").getByText("Home").click();
  await page.waitForTimeout(defaultTimeout);

  //  - waiting for locator('iframe[title="Secure card payment input frame"]').contentFrame().getByRole('textbox', { name: 'Credit or debit card number' }) // Updated locator

  //stripe payment
  await page
    .locator('iframe[title="Secure card payment input frame"]') // Updated locator
    .contentFrame()
    .getByRole("textbox", { name: "Credit or debit card number" })
    .click();
  await page.waitForTimeout(defaultTimeout);

  await page
    .locator('iframe[title="Secure card payment input frame"]') // Updated locator
    .contentFrame()
    .getByRole("textbox", { name: "Credit or debit card number" })
    .fill("4242 4242 4242 4242");
  await page.waitForTimeout(defaultTimeout);

  await page
    .locator('iframe[title="Secure card payment input frame"]') // Updated locator
    .contentFrame()
    .getByRole("textbox", { name: "Credit or debit card expiration date" })
    .fill("04 / 27"); // Note: Expiration date format might need correction (e.g., MM / YY)
  await page.waitForTimeout(defaultTimeout);

  await page
    .locator('iframe[title="Secure card payment input frame"]') // Updated locator
    .contentFrame()
    .getByRole("textbox", { name: "Credit or debit card CVC/CVV" })
    .fill("245"); // Note: Expiration date format might need correction (e.g., MM / YY)
  await page.waitForTimeout(defaultTimeout);

  //Credit or debit card CVC/CVV

  await page.waitForTimeout(5000);
  console.log("1. Pausing execution after dialog handling...");

  page.once("dialog", async (dialog) => {
    // Make handler async
    console.log(`Dialog message: ${dialog.message()}`);
    await page.waitForTimeout(5000);
    await dialog.accept(); // Change dismiss() to accept()
    //console.log("Dialog accepted.");
    //resolve(); // Resolve the promise when the dialog is handled
  });

  // This click likely triggers the dialog
  await page
    .getByRole("button", { name: "Make Payment (£1.99 for 30" })
    .click();

  await page.waitForTimeout(5000);
  console.log("2. Pausing execution after dialog handling...");
  await page.pause();

  // Handle the dialog by accepting it (clicking OK)
  // const dialogHandledPromise = new Promise<void>((resolve) => {
  //   page.once("dialog", async (dialog) => {
  //     // Make handler async
  //     console.log(`Dialog message: ${dialog.message()}`);
  //     //await dialog.accept(); // Change dismiss() to accept()
  //     //console.log("Dialog accepted.");
  //     //resolve(); // Resolve the promise when the dialog is handled
  //   });
  // });

  // This click likely triggers the dialog
  // await page
  //   .getByRole("button", { name: "Make Payment (£1.99 for 30" })
  //   .click();

  // Wait for the dialog handler to complete
  //await dialogHandledPromise;

  // Add a small explicit wait to allow the UI to potentially settle after dialog acceptance
  await page.waitForTimeout(5000);

  // Pause after the dialog has been handled and UI has settled
  console.log("Pausing execution after dialog handling...");

  await page.waitForTimeout(15000);

  await page.pause();

  //================
  // 7) Pause so you can inspect the final state
  // await page.pause(); // Removed the duplicate pause
  // await sh.close();  // re‑enable when you’re ready to auto‑close
}

run().catch(console.error);
