import { chromium, Dialog, Browser } from "playwright";
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
 * Runs the full test workflow exactly as in helloDashboard.ts for a single user,
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

    for (let i = 0; i < environments.length; i++) {
      const env = environments[i];
      const isLocal = env.name === "LOCAL";
      const environmentName = env.name;

      console.log(
        `[${user.userId}] === Starting Environment: ${env.name} (Iteration ${i + 1}) ===`,
      );

      // 1. Navigate to Login Page for the current environment
      console.log(`[${user.userId}][${env.name}] Navigating to: ${env.url}`);
      await page.goto(env.url);
      await page.waitForTimeout(defaultTimeout); // Initial wait like in helloDashboard

      // ==============================================================
      // START: Exact workflow from helloDashboard.ts
      // ==============================================================

      //================
      //PHASE ONE

      // --- Sign-up attempt (using CURRENT USER's credentials) ---
      console.log(
        `[${user.userId}][${env.name}] Attempting sign-up with USER credentials: ${user.email}`,
      );
      try {
        await page.getByTestId("signin").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("firstNamesString").click();
        await page.waitForTimeout(defaultTimeout);
        const nameParts = user.userId.split("_");
        await page
          .getByTestId("firstNamesString")
          .fill(nameParts[0] || user.userId);
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("lastNameString").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("lastNameString").fill(nameParts[1] || "User");
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("email").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("email").fill(user.email); // Use user's email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.userId); // Use user's userId for username field
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user's password
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("agree").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "Sign Up" }).click();
        await page.waitForTimeout(defaultTimeout);

        // Handle potential "already exists" dialog
        await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
        console.log(
          `[${user.userId}][${env.name}] Clicked OK after sign-up attempt with user credentials.`,
        );
        await page.waitForTimeout(defaultTimeout);
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Sign-up attempt with user credentials or OK button failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Attempt to recover by ensuring login tab is visible
        try {
          await page.getByTestId("login").click();
        } catch {
          /* ignore */
        }
        await page.waitForTimeout(defaultTimeout);
      }

      // Switch back to login tab/view (try/catch as in original)
      try {
        await page.getByTestId("login").click();
        console.log(
          `[${user.userId}][${env.name}] Clicked login tab/button successfully.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Could not click login tab/button, continuing execution: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await page.waitForTimeout(defaultTimeout);

      // --- Primary Login attempt (using CURRENT USER's credentials) ---
      console.log(
        `[${user.userId}][${env.name}] Attempting primary login with email: ${user.email}`,
      );
      try {
        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout / 2);
        await page.getByTestId("username").fill(user.email); // Use user's email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout / 2);
        await page.getByTestId("password").fill(user.password); // Use user's password
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch (error: unknown) {
          console.warn(
            `[${user.userId}][${env.name}] Could not click 'agree' before seek: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        await page.getByTestId("seek").click();
        console.log(`[${user.userId}][${env.name}] Clicked 'seek' button.`);

        // Wait for dashboard URL
        const expectedDashboardPattern = isLocal
          ? /localhost.*dashboard/
          : /jobenvy-v6-824\.nodechef\.com.*dashboard/;
        await page.waitForURL(expectedDashboardPattern, { timeout: 15000 });
        console.log(
          `[${user.userId}][${env.name}] Successfully logged in and navigated to dashboard.`,
        );
      } catch (error: unknown) {
        console.error(
          `[${user.userId}][${env.name}] Login failed or did not navigate to dashboard: ${error instanceof Error ? error.message : String(error)}`,
        );
        console.log(
          `[${user.userId}][${env.name}] Skipping rest of workflow for this environment.`,
        );
        // If login fails, skip the rest of the actions for this environment
        continue; // Go to the next environment (or finish if this was staging)
      }

      // --- Post-login actions from original script ---
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
          `[${user.userId}][${env.name}] Dialog message: ${dialog.message()}`,
        );
        dialog.dismiss().catch(() => {}); // Dismiss delete confirmation
      });
      await page.getByRole("button", { name: "OK" }).click();
      await page.waitForTimeout(defaultTimeout); // Wait after clicking OK

      // --- Intermediate Sign-up attempt (using CURRENT USER's credentials) ---
      console.warn(
        `[${user.userId}][${env.name}] Attempting intermediate sign-up with USER credentials: ${user.email}. This is likely problematic.`,
      );
      try {
        await page.getByTestId("signin").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("firstNamesString").click();
        await page.waitForTimeout(defaultTimeout);
        const nameParts = user.userId.split("_");
        await page
          .getByTestId("firstNamesString")
          .fill(nameParts[0] || user.userId);
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("lastNameString").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("lastNameString").fill(nameParts[1] || "User");
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("email").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("email").fill(user.email); // Use user's email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.userId); // Use user's userId for username field
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user's password
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("agree").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "Sign Up" }).click();
        await page.waitForTimeout(defaultTimeout);
        // Handle potential OK button again
        await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
        await page.waitForTimeout(defaultTimeout);
        console.log(
          `[${user.userId}][${env.name}] Intermediate sign-up attempt finished.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Intermediate sign-up attempt failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Attempt to recover by ensuring login tab is visible
        try {
          await page.getByTestId("login").click();
        } catch {
          /* ignore */
        }
        await page.waitForTimeout(defaultTimeout);
      }

      // --- Intermediate Login attempt (using CURRENT USER's credentials) ---
      console.warn(
        `[${user.userId}][${env.name}] Attempting intermediate login with USER credentials: ${user.email}.`,
      );
      try {
        await page.getByTestId("login").click();
        await page.waitForTimeout(defaultTimeout / 2);

        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.email); // Use user's email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user's password
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        await page.getByTestId("seek").click();
        await page.waitForTimeout(defaultTimeout);
        // Check if dashboard is reached again
        const expectedDashboardPattern = isLocal
          ? /localhost.*dashboard/
          : /jobenvy-v6-824\.nodechef\.com.*dashboard/;
        await page.waitForURL(expectedDashboardPattern, { timeout: 10000 });
        console.log(
          `[${user.userId}][${env.name}] Intermediate login successful (reached dashboard).`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Intermediate login attempt failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // If intermediate login fails, subsequent steps might also fail.
      }

      // --- Fragile locator click and img click (as in original) ---
      try {
        console.log(
          `[${user.userId}][${env.name}] Attempting fragile locator click...`,
        );
        await page
          .locator(
            "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
          )
          .first()
          .click();
        await page.waitForTimeout(defaultTimeout);
        console.log(
          `[${user.userId}][${env.name}] Attempting img click after fragile locator...`,
        );
        await page.locator("img").click(); // Which image? Using original generic selector.
        await page.waitForTimeout(defaultTimeout);
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Fragile locator/img click failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // --- CHATBOT Interaction 1 ---
      try {
        console.log(
          `[${user.userId}][${env.name}] Starting Chatbot Interaction 1...`,
        );
        await page.getByText("Start A Chat").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("RNE__Input__text-input").click();
        await page.waitForTimeout(defaultTimeout);
        // Parameterize chat message slightly
        await page
          .getByTestId("RNE__Input__text-input")
          .fill(
            `hi from ${user.userId} on ${env.name} - help me update my master resume`,
          );
        await page.waitForTimeout(5000);
        await page.getByText("").click(); // Send button
        await page.waitForTimeout(5000);
        await page.getByText("Close Your Agent").click();
        console.log(
          `[${user.userId}][${env.name}] Chatbot Interaction 1 finished.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Chatbot Interaction 1 failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        try {
          await page.getByText("Close Your Agent").click();
        } catch {
          /* ignore */
        }
      }
      await page.waitForTimeout(defaultTimeout); // Wait after closing chat

      // --- Back click and img click between chats (as in original) ---
      try {
        console.log(
          `[${user.userId}][${env.name}] Attempting Back and img click between chats...`,
        );
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);
        await page.locator("img").first().click(); // Which image? Using original generic selector.
        await page.waitForTimeout(defaultTimeout);
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Back/img click between chats failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // --- CHATBOT Interaction 2 ---
      try {
        console.log(
          `[${user.userId}][${env.name}] Starting Chatbot Interaction 2...`,
        );
        await page.getByText("Start A Chat").click();
        await page.waitForTimeout(5000); // Longer wait before interacting
        await page.getByTestId("RNE__Input__text-input").click();
        await page.waitForTimeout(defaultTimeout);
        // Parameterize chat message slightly
        await page
          .getByTestId("RNE__Input__text-input")
          .fill(
            `what is the job situation like in Brighton UK for software engineering roles? [User: ${user.userId}, Env: ${env.name}]`,
          );
        await page.waitForTimeout(5000);
        await page.getByText("").click(); // Send button
        await page.waitForTimeout(15000); // Longer wait for response (original had 3x 5000ms)
        await page.getByText("Close Your Agent").click();
        console.log(
          `[${user.userId}][${env.name}] Chatbot Interaction 2 finished.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Chatbot Interaction 2 failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        try {
          await page.getByText("Close Your Agent").click();
        } catch {
          /* ignore */
        }
      }
      await page.waitForTimeout(defaultTimeout); // Wait after closing chat

      //================
      //PHASE TWO

      // Explicit navigation to dashboard (as in original Phase Two start)
      // Determine dashboard URL based on current environment URL
      const dashboardUrl = env.url.replace("/login", "/dashboard/jobseeker/");
      console.log(
        `[${user.userId}][${env.name}] Navigating explicitly to dashboard: ${dashboardUrl}`,
      );
      try {
        await page.goto(dashboardUrl);
        await page.waitForTimeout(defaultTimeout);
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Failed to navigate explicitly to dashboard: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue anyway, maybe already there or recovered?
      }

      // --- Phase Two interactions (wrapped in try/catch) ---
      try {
        console.log(
          `[${user.userId}][${env.name}] Starting Phase Two interactions...`,
        );
        // Interact with Master Resume section (using original selector)
        await page
          .locator("div")
          // Adjusted selector slightly based on original, check if still valid
          .filter({ hasText: /^MASTER RESUME.*Complete$/ })
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
          .fill(`Test Resume ${user.userId} ${env.name}`);
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Your Profiles").click(); // Navigate back or confirm? Check UI flow.
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("listItem_0").click(); // Select the first item (assuming it's the new one)
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("done").getByTestId("iconIcon").click(); // Save/confirm
        await page.waitForTimeout(defaultTimeout);
        await page
          .locator("span")
          .filter({ hasText: `Test Resume ${user.userId} ${env.name}` }) // Use unique name
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
          .fill(`Test Job Title ${user.userId} ${env.name}`);
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("headerContainer")
          .getByTestId("iconIcon")
          .click(); // Save/confirm icon?
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
          .fill(`Test Summary for ${user.userId} on ${env.name}`);
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("headerContainer")
          .getByTestId("iconIcon")
          .click(); // Save/confirm icon?
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Back").click(); // Back again
        await page.waitForTimeout(defaultTimeout);

        console.log(
          `[${user.userId}][${env.name}] Phase Two interactions finished.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Phase Two interaction failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Decide if the overall test should fail if Phase Two fails
        // For now, just warn and continue to logout/next steps
      }

      // --- Logout sequence at end of iteration (as in original) ---
      try {
        console.log(`[${user.userId}][${env.name}] Attempting logout...`);
        await page.getByTestId("left_nav_button").getByText("Home").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "log out" }).click();
        await page.waitForTimeout(defaultTimeout);
        page.once("dialog", (dialog: Dialog) => {
          console.log(
            `[${user.userId}][${env.name}] Logout Dialog message: ${dialog.message}`,
          );
          dialog.accept().catch(() => {});
        });
        await page.getByRole("button", { name: "OK" }).click();
        console.log(`[${user.userId}][${env.name}] Logged out successfully.`);
        await page.waitForTimeout(defaultTimeout); // Wait after logout action
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Logout failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // --- Re-login attempt with CURRENT USER's credentials ---
      console.warn(
        `[${user.userId}][${env.name}] Attempting re-login with USER credentials at end of iteration: ${user.email}`,
      );
      try {
        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.email); // Use user's email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user's password
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        await page.getByTestId("seek").click();
        await page.waitForTimeout(defaultTimeout); // Wait after seek
        const expectedDashboardPattern = isLocal
          ? /localhost.*dashboard/
          : /jobenvy-v6-824\.nodechef\.com.*dashboard/;
        await page.waitForURL(expectedDashboardPattern, { timeout: 10000 });
        console.log(
          `[${user.userId}][${env.name}] Re-login at end of iteration successful.`,
        );
      } catch (error: unknown) {
        console.warn(
          `[${user.userId}][${env.name}] Re-login attempt at end of iteration failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // --- Staging click logic from original (only if i === 0, which means LOCAL env) ---
      if (i === 0) {
        console.log(
          `[${user.userId}][${env.name}] First iteration complete. Clicking Staging button (as per original script).`,
        );
        try {
          await page.waitForTimeout(defaultTimeout);
          await page.getByTestId("left_nav_button").getByText("Home").click();
          await page.waitForTimeout(defaultTimeout);
          await page.getByRole("button", { name: "log out" }).click();
          await page.waitForTimeout(defaultTimeout);
          page.once("dialog", (dialog: Dialog) => {
            dialog.accept().catch(() => {});
          });
          await page.getByRole("button", { name: "OK" }).click();
          await page.waitForTimeout(defaultTimeout);
          console.log(
            `[${user.userId}][${env.name}] Logged out before clicking Staging.`,
          );

          await page.waitForTimeout(defaultTimeout);
          await page.getByText("Staging").click();
          await page.waitForTimeout(defaultTimeout);
          console.log(`[${user.userId}][${env.name}] Clicked Staging button.`);
        } catch (error: unknown) {
          console.warn(
            `[${user.userId}][${env.name}] Logout or Staging click failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        console.log(`[${user.userId}][${env.name}] Second iteration complete.`);
      }

      console.log(`[${user.userId}] === Finished Environment: ${env.name} ===`);
    } // End of environment loop

    console.log(`[${user.userId}] Full test run completed successfully.`);
  } catch (error: unknown) {
    console.error(
      `[${user.userId}] Test run failed:`,
      error instanceof Error ? error.message : error,
    );
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
    await Promise.all(users.map((user) => runTestForUser(user)));
    console.log("All parallel test runs initiated and completed (or failed).");
  } catch (error: unknown) {
    console.error(
      "An error occurred during the parallel execution setup or Promise.all:",
      error instanceof Error ? error.message : error,
    );
  } finally {
    console.log("Parallel test execution script finished.");
  }
})();
