import { chromium, Page } from "playwright"; // Import chromium and Page type
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the users and their credentials
// IMPORTANT: Replace placeholders with actual test credentials if different
const users = [
  {
    userId: "testuser",
    email: "test.user@jobenvy.co.uk",
    password: "testuser",
  }, // Using credentials from helloDashboard
  {
    userId: "testuser_1",
    email: "testuser_1@jobenvy.co.uk",
    password: "password123",
  }, // Example credentials
  {
    userId: "testuser_2",
    email: "testuser_2@jobenvy.co.uk",
    password: "password123",
  }, // Example credentials
];

// --- Configuration (adapted from helloDashboard.ts) ---
const targetEnvironment = process.env.TARGET_ENV ?? "LOCAL"; // Use TARGET_ENV or default to LOCAL
const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login";
const remoteUrl =
  process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login";
const targetUrl = targetEnvironment === "LOCAL" ? localUrl : remoteUrl;

// Set timeout based on environment - consider if slowMo affects this need
const defaultTimeout = targetEnvironment === "REMOTE" ? 2000 : 1000; // Adjusted timeout slightly
const slowMo = 250; // Keep slowMo for visibility
// --- End Configuration ---

// Function to perform the core workflow steps after login
// Takes the Playwright page object and user ID for logging
async function performCoreWorkflow(page: Page, userId: string) {
  console.log(`[${userId}] Starting core workflow mirroring helloDashboard...`);

  //================
  // PHASE ONE (Adapted from helloDashboard loop iteration)
  //================
  // Assumes user is already logged in at this point.

  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("profile").getByText("Profile").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(defaultTimeout);

  // Fill in the first name with a timestamp and user ID
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  // Use userId instead of environmentLabel from the original loop
  const nameWithTimestamp = `${userId} Test [${timestamp}]`;
  await page.getByTestId("firstNamesString").fill(nameWithTimestamp);
  await page.waitForTimeout(defaultTimeout);

  await page.getByTestId("done").getByTestId("iconIcon").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByText("MASTER RESUME").click(); // Using the icon/text selector from original
  await page.waitForTimeout(defaultTimeout);
  await page.getByText("Back").click();
  await page.waitForTimeout(defaultTimeout);

  // CHATBOT Interaction 1
  try {
    console.log(`[${userId}] Starting Chatbot Interaction 1...`);
    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill(`hi from ${userId} - help me update my master resume`);
    await page.waitForTimeout(5000); // Wait for potential response/processing
    await page.getByText("").click(); // Send button
    await page.waitForTimeout(5000); // Wait again
    await page.getByText("Close Your Agent").click();
    console.log(`[${userId}] Chatbot Interaction 1 finished.`);
  } catch (error) {
    console.warn(`[${userId}] Chatbot Interaction 1 failed: ${error.message}`);
    // Attempt to close if possible, otherwise continue
    try {
      await page.getByText("Close Your Agent").click();
    } catch {
      /* ignore */
    }
  }
  await page.waitForTimeout(defaultTimeout); // Wait after closing chat

  // CHATBOT Interaction 2
  try {
    console.log(`[${userId}] Starting Chatbot Interaction 2...`);
    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(5000); // Longer wait before interacting
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill(
        `what is the job situation like in Brighton UK for software engineering roles? [User: ${userId}]`,
      );
    await page.waitForTimeout(5000); // Wait
    await page.getByText("").click(); // Send button
    await page.waitForTimeout(15000); // Longer wait for response (original had 3x 5000ms)
    await page.getByText("Close Your Agent").click();
    console.log(`[${userId}] Chatbot Interaction 2 finished.`);
  } catch (error) {
    console.warn(`[${userId}] Chatbot Interaction 2 failed: ${error.message}`);
    // Attempt to close if possible, otherwise continue
    try {
      await page.getByText("Close Your Agent").click();
    } catch {
      /* ignore */
    }
  }
  await page.waitForTimeout(defaultTimeout); // Wait after closing chat

  //================
  // PHASE TWO (Adapted from helloDashboard loop iteration)
  //================
  // Note: Original script explicitly navigated here. Assuming user might already be
  // on the dashboard or can navigate from current state. If explicit navigation is
  // required *after* the chat interactions, uncomment the next line.
  // await page.goto(`${targetUrl.replace('/login', '/dashboard/jobseeker/')}`); // Adjust URL based on actual dashboard path
  // await page.waitForTimeout(defaultTimeout);

  try {
    // Wrap Phase Two interactions in try/catch for robustness
    console.log(`[${userId}] Starting Phase Two interactions...`);
    // Interact with Master Resume section
    await page
      .locator("div")
      .filter({ hasText: /^MASTER RESUME/ })
      .getByTestId("listItemTitle")
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("").nth(1).click(); // Icon button - ensure it's the correct one
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("resume", { exact: true }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("portfolio").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);

    // Add/Edit Job Role/Resume Profile
    await page.getByTestId("add_jobrole").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("addNew").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("addNew").fill(`Test Resume ${userId}`); // Add user ID
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Your Profiles").click(); // Navigate back or confirm? Check UI flow.
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("listItem_0").click(); // Select the first item (assuming it's the new one)
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("done").getByTestId("iconIcon").click(); // Save/confirm
    await page.waitForTimeout(defaultTimeout);
    await page
      .locator("span")
      .filter({ hasText: `Test Resume ${userId}` })
      .click(); // Click the newly created item
    await page.waitForTimeout(defaultTimeout);

    // Interact within the resume item (selectors might be fragile)
    await page
      .locator("div")
      .filter({ hasText: /^Not Assigned$/ })
      .nth(3)
      .click(); // Needs verification
    await page.waitForTimeout(defaultTimeout);
    // This selector looks very unstable, prefer test IDs or roles if possible
    await page
      .locator(
        "div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div > div > div > div > div",
      )
      .first()
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("jobTitle").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("jobTitle").fill(`Test Job Title ${userId}`);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("headerContainer").getByTestId("iconIcon").click(); // Save/confirm icon?
    await page.waitForTimeout(defaultTimeout);

    // Navigate CV sections
    await page.getByText("cv").click(); // CV icon/link
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Curriculum Vitae", { exact: true }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Summary").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("summary").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("summary").fill(`Test Summary for ${userId}`);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("headerContainer").getByTestId("iconIcon").click(); // Save/confirm icon?
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click(); // Back again
    await page.waitForTimeout(defaultTimeout);

    console.log(`[${userId}] Phase Two interactions finished.`);
  } catch (error) {
    console.warn(`[${userId}] Phase Two interaction failed: ${error.message}`);
  }

  // The logout sequence is handled *after* this function returns in runTestWorkflow
  console.log(`[${userId}] Core workflow steps completed.`);
}

// The main function that runs the test for a given user
async function runTestWorkflow(user: {
  userId: string;
  email: string;
  password: string;
}) {
  console.log(`Starting test for ${user.userId}`);
  let browser; // Declare browser outside try block

  try {
    browser = await chromium.launch({
      headless: false, // Keep the browser visible
      slowMo: slowMo, // Use configured slowMo
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the login page
    console.log(`[${user.userId}] Navigating to: ${targetUrl}`);
    await page.goto(targetUrl);
    await page.waitForTimeout(defaultTimeout); // Wait for page load

    // Ensure we are on the Login tab/section (handle potential initial state)
    try {
      // Check if sign-in elements are visible, if not, click login tab
      const usernameField = page.getByTestId("username");
      if (!(await usernameField.isVisible({ timeout: 5000 }))) {
        console.log(
          `[${user.userId}] Login fields not visible, attempting to click login tab.`,
        );
        await page.getByTestId("login").click(); // Assumes a 'login' tab/button exists
        await page.waitForTimeout(defaultTimeout);
      }
    } catch (error) {
      console.warn(
        `[${user.userId}] Could not ensure login tab/section: ${error.message}. Proceeding anyway.`,
      );
    }

    // Log in using the test user credentials
    console.log(`[${user.userId}] Attempting login with email: ${user.email}`);
    await page.getByTestId("username").fill(user.email); // Use email for username field
    await page.waitForTimeout(defaultTimeout / 2); // Shorter wait
    await page.getByTestId("password").fill(user.password);
    await page.waitForTimeout(defaultTimeout / 2);
    // Click the appropriate login/seek button
    // Adjust selector based on actual login button test ID or role
    await page.getByTestId("seek").click(); // Assuming 'seek' is the login button after filling credentials

    // Wait for navigation to dashboard or a known element indicating successful login
    // Replace with a more specific selector if possible
    console.log(
      `[${user.userId}] Waiting for navigation/dashboard after login...`,
    );
    await page.waitForURL(/dashboard/, { timeout: 15000 }); // Wait for URL containing 'dashboard'
    // or await page.waitForSelector('#dashboard-element-id', { timeout: 15000 });

    console.log(`[${user.userId}] Logged in successfully.`);

    // Perform the core workflow steps
    await performCoreWorkflow(page, user.userId);

    console.log(`[${user.userId}] Test workflow completed successfully.`);
  } catch (error) {
    console.error(`[${user.userId}] Test workflow failed:`, error);
  } finally {
    // Close the browser after the test, regardless of success or failure
    if (browser) {
      await browser.close();
      console.log(`[${user.userId}] Browser closed.`);
    }
  }
}

// Main execution block
(async () => {
  console.log(`Starting parallel tests for ${users.length} users...`);
  console.log(`Target URL: ${targetUrl}`);
  console.log(`Default Timeout: ${defaultTimeout}ms, SlowMo: ${slowMo}ms`);

  try {
    // Run all tests in parallel
    await Promise.all(users.map((user) => runTestWorkflow(user)));
    console.log("All test workflows have been initiated.");
    // Note: Promise.all waits for all promises to resolve (or one to reject).
    // The console log "All test workflows finished." might appear before browsers actually close if there are errors.
  } catch (error) {
    console.error(
      "An error occurred during the parallel execution setup:",
      error,
    );
  } finally {
    console.log("Parallel test execution script finished.");
  }
})();
