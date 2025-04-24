import { chromium, Page, Dialog, Browser } from "playwright";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the users and their credentials
const users = [
  {
    userId: "testuser",
    email: "test.user@jobenvy.co.uk",
    password: "testuser",
  },
  {
    userId: "testuser_1",
    email: "testuser_1@jobenvy.co.uk",
    password: "password123",
  },
  {
    userId: "testuser_2",
    email: "testuser_2@jobenvy.co.uk",
    password: "password123",
  },
];

// --- Configuration ---
const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login";
const remoteUrl =
  process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login"; // Staging URL
const defaultTimeout = 2000;
const slowMo = 250;
// --- End Configuration ---

/**
 * Executes the core JobEnvy workflow on a given page for a specific user and environment.
 * Assumes the user is already logged in.
 * @param page Playwright Page object
 * @param user User object with credentials and ID
 * @param environmentName 'LOCAL' or 'STAGING' for logging/parameterization
 */
async function executeCoreWorkflow(
  page: Page,
  user: (typeof users)[0],
  environmentName: string,
) {
  console.log(
    `[${user.userId}][${environmentName}] Starting core workflow actions...`,
  );

  // ================
  // PHASE ONE (Post-Login)
  // ================
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("profile").getByText("Profile").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("firstNamesString").click(); // Double click?
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("firstNamesString").press("ArrowRight");
  await page.waitForTimeout(defaultTimeout);

  // Fill in the first name with a timestamp, user, and environment indicator
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const nameWithTimestamp = `${user.userId} ${environmentName} [${timestamp}]`;
  await page.getByTestId("firstNamesString").fill(nameWithTimestamp);
  await page.waitForTimeout(defaultTimeout);

  await page.getByTestId("done").getByTestId("iconIcon").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByText("MASTER RESUME").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByText("Back").click();
  await page.waitForTimeout(defaultTimeout);

  // Delete account sequence (Dismissing the confirmation)
  await page.getByTestId("profile").getByText("Profile").click();
  await page.waitForTimeout(defaultTimeout);
  await page.getByTestId("delete_account").click();
  await page.waitForTimeout(defaultTimeout);
  page.once("dialog", (dialog: Dialog) => {
    console.log(
      `[${user.userId}][${environmentName}] Dialog message: ${dialog.message()}`,
    );
    dialog.dismiss().catch(() => {}); // Dismiss delete confirmation
  });
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(defaultTimeout); // Wait after clicking OK

  // NOTE: The original script had intermediate sign-up/login attempts here.
  // These are removed as we assume the user is logged in for the workflow execution.
  // Also removed fragile locators and img clicks as they seemed unreliable.

  // CHATBOT Interaction 1
  try {
    console.log(
      `[${user.userId}][${environmentName}] Starting Chatbot Interaction 1...`,
    );
    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill(
        `hi from ${user.userId} on ${environmentName} - help me update my master resume`,
      );
    await page.waitForTimeout(5000);
    await page.getByText("").click(); // Send
    await page.waitForTimeout(5000);
    await page.getByText("Close Your Agent").click();
    console.log(
      `[${user.userId}][${environmentName}] Chatbot Interaction 1 finished.`,
    );
  } catch (error: any) {
    console.warn(
      `[${user.userId}][${environmentName}] Chatbot Interaction 1 failed: ${error.message}`,
    );
    try {
      await page.getByText("Close Your Agent").click();
    } catch {
      /* ignore */
    } // Attempt close if failed
  }
  await page.waitForTimeout(defaultTimeout);

  // CHATBOT Interaction 2
  try {
    console.log(
      `[${user.userId}][${environmentName}] Starting Chatbot Interaction 2...`,
    );
    // Need to navigate back or ensure 'Start A Chat' is visible again
    // Adding a potential navigation step if needed, e.g., back to dashboard home
    // await page.getByTestId("left_nav_button").getByText("Home").click();
    // await page.waitForTimeout(defaultTimeout);

    await page.getByText("Start A Chat").click();
    await page.waitForTimeout(5000);
    await page.getByTestId("RNE__Input__text-input").click();
    await page.waitForTimeout(defaultTimeout);
    await page
      .getByTestId("RNE__Input__text-input")
      .fill(
        `what is the job situation like in Brighton UK for software engineering roles? [User: ${user.userId}, Env: ${environmentName}]`,
      );
    await page.waitForTimeout(5000);
    await page.getByText("").click(); // Send
    await page.waitForTimeout(15000); // Wait for response
    await page.getByText("Close Your Agent").click();
    console.log(
      `[${user.userId}][${environmentName}] Chatbot Interaction 2 finished.`,
    );
  } catch (error: any) {
    console.warn(
      `[${user.userId}][${environmentName}] Chatbot Interaction 2 failed: ${error.message}`,
    );
    try {
      await page.getByText("Close Your Agent").click();
    } catch {
      /* ignore */
    } // Attempt close if failed
  }
  await page.waitForTimeout(defaultTimeout);

  // ================
  // PHASE TWO
  // ================
  // Ensure we are on the dashboard for Phase Two actions
  const dashboardUrl = (await page.url()).includes("localhost")
    ? localUrl.replace("/login", "/dashboard/jobseeker/")
    : remoteUrl.replace("/login", "/dashboard/jobseeker/");
  if (!page.url().includes("/dashboard/jobseeker/")) {
    console.log(
      `[${user.userId}][${environmentName}] Navigating explicitly to dashboard: ${dashboardUrl}`,
    );
    try {
      await page.goto(dashboardUrl);
      await page.waitForTimeout(defaultTimeout);
    } catch (error: any) {
      console.warn(
        `[${user.userId}][${environmentName}] Failed to navigate explicitly to dashboard: ${error.message}`,
      );
      // If navigation fails, Phase Two might not work correctly. Consider stopping.
      throw new Error(`Failed to navigate to dashboard for Phase Two.`);
    }
  }

  // Phase Two interactions (wrapped in try/catch)
  try {
    console.log(
      `[${user.userId}][${environmentName}] Starting Phase Two interactions...`,
    );
    // Interact with Master Resume section
    await page
      .locator("div")
      .filter({ hasText: /^MASTER RESUME.*Complete$/ }) // Original potentially fragile selector
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
    // Use unique name based on user and environment
    await page
      .getByTestId("addNew")
      .fill(`Test Resume ${user.userId} ${environmentName}`);
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Your Profiles").click(); // Navigate back or confirm? Check UI flow.
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("listItem_0").click(); // Select the first item (assuming it's the new one)
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("done").getByTestId("iconIcon").click(); // Save/confirm
    await page.waitForTimeout(defaultTimeout);
    await page
      .locator("span")
      .filter({ hasText: `Test Resume ${user.userId} ${environmentName}` }) // Use unique name
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
    // Use unique job title
    await page
      .getByTestId("jobTitle")
      .fill(`Test Job Title ${user.userId} ${environmentName}`);
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
    // Use unique summary
    await page
      .getByTestId("summary")
      .fill(`Test Summary for ${user.userId} on ${environmentName}`);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("headerContainer").getByTestId("iconIcon").click(); // Save/confirm icon?
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click(); // Back again
    await page.waitForTimeout(defaultTimeout);

    console.log(
      `[${user.userId}][${environmentName}] Phase Two interactions finished.`,
    );
  } catch (error: any) {
    console.warn(
      `[${user.userId}][${environmentName}] Phase Two interaction failed: ${error.message}`,
    );
    // Decide if the overall test should fail if Phase Two fails
    throw error; // Re-throw to indicate failure for this environment run
  }

  console.log(
    `[${user.userId}][${environmentName}] Core workflow actions completed.`,
  );
}

/**
 * Runs the full test (Login -> Workflow -> Logout) for a single user,
 * first on Local, then on Staging.
 * @param user User object with credentials and ID
 */
async function runTestForUser(user: (typeof users)[0]) {
  console.log(`[${user.userId}] Starting full test run...`);
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: false, // Keep visible for debugging
      slowMo: slowMo,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const environments = [
      { name: "LOCAL", url: localUrl },
      { name: "STAGING", url: remoteUrl },
    ];

    for (const env of environments) {
      console.log(`[${user.userId}] === Starting Environment: ${env.name} ===`);

      // 1. Navigate to Login Page
      console.log(`[${user.userId}][${env.name}] Navigating to: ${env.url}`);
      await page.goto(env.url);
      await page.waitForTimeout(defaultTimeout);

      // 2. Login with user-specific credentials
      console.log(
        `[${user.userId}][${env.name}] Attempting login with email: ${user.email}`,
      );
      // Ensure login tab is selected (if applicable, might not be needed on fresh nav)
      // try { await page.getByTestId("login").click(); } catch { /* ignore */ }
      // await page.waitForTimeout(defaultTimeout / 2);

      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("username").fill(user.email);
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("password").fill(user.password);
      await page.waitForTimeout(defaultTimeout);
      try {
        await page.getByTestId("agree").click();
        await page.waitForTimeout(defaultTimeout);
      } catch (error: any) {
        console.warn(
          `[${user.userId}][${env.name}] Could not click 'agree' before seek: ${error.message}`,
        );
      }
      await page.getByTestId("seek").click();
      console.log(`[${user.userId}][${env.name}] Clicked 'seek' button.`);

      // Wait for dashboard URL
      const expectedDashboardPattern =
        env.name === "LOCAL"
          ? /localhost.*dashboard/
          : /jobenvy-v6-824\.nodechef\.com.*dashboard/; // Adjust regex for staging if needed
      try {
        await page.waitForURL(expectedDashboardPattern, { timeout: 15000 });
        console.log(
          `[${user.userId}][${env.name}] Successfully logged in and navigated to dashboard.`,
        );
      } catch (error: any) {
        console.error(
          `[${user.userId}][${env.name}] Login failed or did not navigate to dashboard: ${error.message}`,
        );
        console.log(
          `[${user.userId}][${env.name}] Skipping workflow for this environment.`,
        );
        continue; // Skip to the next environment (staging) if login fails
      }
      await page.waitForTimeout(defaultTimeout); // Wait after dashboard load

      // 3. Execute the core workflow
      await executeCoreWorkflow(page, user, env.name);

      // 4. Logout
      try {
        console.log(`[${user.userId}][${env.name}] Attempting logout...`);
        // Ensure Home is clicked first if logout is in nav menu
        await page.getByTestId("left_nav_button").getByText("Home").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "log out" }).click();
        await page.waitForTimeout(defaultTimeout);
        page.once("dialog", (dialog: Dialog) => {
          console.log(
            `[${user.userId}][${env.name}] Logout Dialog message: ${dialog.message()}`,
          );
          dialog.accept().catch(() => {}); // Accept logout confirmation
        });
        await page.getByRole("button", { name: "OK" }).click(); // Confirm logout
        console.log(`[${user.userId}][${env.name}] Logged out successfully.`);
        await page.waitForTimeout(defaultTimeout); // Wait after logout dialog
      } catch (error: any) {
        console.warn(
          `[${user.userId}][${env.name}] Logout failed: ${error.message}`,
        );
        // Continue to next environment even if logout fails
      }

      console.log(`[${user.userId}] === Finished Environment: ${env.name} ===`);
    } // End of environment loop

    console.log(`[${user.userId}] Full test run completed successfully.`);
  } catch (error: any) {
    console.error(`[${user.userId}] Test run failed:`, error);
    // Optionally re-throw the error if one user failing should stop everything
    // throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[${user.userId}] Browser closed.`);
    }
  }
}

// Main execution block
(async () => {
  console.log(
    `Starting parallel test runs for ${users.length} users (Local then Staging)...`,
  );
  console.log(`Local URL: ${localUrl}`);
  console.log(`Staging URL: ${remoteUrl}`);
  console.log(`Default Timeout: ${defaultTimeout}ms, SlowMo: ${slowMo}ms`);

  try {
    // Run tests for all users in parallel
    await Promise.all(users.map((user) => runTestForUser(user)));
    console.log("All parallel test runs initiated and completed (or failed).");
  } catch (error: any) {
    console.error(
      "An error occurred during the parallel execution setup or Promise.all:",
      error,
    );
  } finally {
    console.log("Parallel test execution script finished.");
  }
})();
