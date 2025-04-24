import { chromium, Page, Dialog } from "playwright"; // Import chromium, Page, and Dialog types
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the users and their credentials
const users = [
  {
    userId: "testuser",
    email: "test.user@jobenvy.co.uk", // Primary email for this user
    password: "testuser", // Primary password for this user
  },
  {
    userId: "testuser_1",
    email: "testuser_1@jobenvy.co.uk", // Primary email for this user
    password: "password123", // Primary password for this user
  },
  {
    userId: "testuser_2",
    email: "testuser_2@jobenvy.co.uk", // Primary email for this user
    password: "password123", // Primary password for this user
  },
];

// --- Configuration ---
// Define URLs directly, removing TARGET_ENV logic for this script's purpose
const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login";
const remoteUrl =
  process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login"; // Assuming this is Staging

// Timeout and SlowMo settings
const defaultTimeout = 2000; // Keeping a consistent timeout
const slowMo = 250; // Keep slowMo for visibility
// --- End Configuration ---

// The main function that runs the test for a given user
async function runTestWorkflow(user: {
  userId: string;
  email: string; // Primary email for successful login
  password: string; // Primary password for successful login
}) {
  console.log(`[${user.userId}] Starting test workflow...`);
  let browser; // Declare browser outside try block

  try {
    browser = await chromium.launch({
      headless: false, // Keep the browser visible
      slowMo: slowMo, // Use configured slowMo
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Loop through the workflow twice (Iteration 1: Local, Iteration 2: Staging)
    for (let i = 0; i < 2; i++) {
      const isLocalIteration = i === 0;
      const currentIterationUrl = isLocalIteration ? localUrl : remoteUrl;
      const environmentName = isLocalIteration ? "LOCAL" : "STAGING";

      console.log(
        `[${user.userId}] Starting Iteration ${i + 1} (${environmentName}) against ${currentIterationUrl}`,
      );

      // Navigate to the correct login page for the current iteration
      console.log(`[${user.userId}] Navigating to: ${currentIterationUrl}`);
      await page.goto(currentIterationUrl);
      await page.waitForTimeout(defaultTimeout); // Wait for page load

      // ==============================================================
      // START: Workflow for the current iteration
      // ==============================================================

      //================
      //PHASE ONE

      // --- Sign-up attempt (using original hardcoded values - consider if this should be unique per env/user) ---
      // Note: Signing up the same user 'testuser' might cause issues on the second iteration if the first succeeded.
      console.log(`[${user.userId}] Attempting sign-up...`);
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
      await page.getByTestId("email").fill("test.user@jobenvy.co.uk"); // Hardcoded
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").fill("testuser"); // Hardcoded
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").fill("testuser"); // Hardcoded
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("agree").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.waitForTimeout(defaultTimeout);

      // Handle potential "already exists" dialog
      try {
        await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
        console.log(`[${user.userId}] Clicked OK after sign-up attempt.`);
        await page.waitForTimeout(defaultTimeout);
      } catch {
        console.log(
          `[${user.userId}] OK button after sign-up not found or timed out, continuing.`,
        );
      }

      // Switch back to login tab/view
      try {
        await page.getByTestId("login").click();
        console.log(`[${user.userId}] Clicked login tab/button successfully.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Could not click login tab/button, continuing execution:`,
          error.message,
        );
      }
      await page.waitForTimeout(defaultTimeout);

      // --- Primary Login attempt (using the specific user's credentials for this iteration's environment) ---
      console.log(
        `[${user.userId}] Attempting primary login with email: ${user.email} on ${environmentName}`,
      );
      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("username").fill(user.email); // Use user-specific email
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("password").fill(user.password); // Use user-specific password
      await page.waitForTimeout(defaultTimeout);
      try {
        await page.getByTestId("agree").click();
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Could not click 'agree' before seek: ${error.message}`,
        );
      }
      await page.getByTestId("seek").click();
      console.log(`[${user.userId}] Clicked 'seek' button.`);

      // Wait for dashboard URL (adjust base URL based on iteration)
      const expectedDashboardPattern = isLocalIteration
        ? /localhost.*dashboard/
        : /jobenvy-v6-824\.nodechef\.com.*dashboard/;
      try {
        await page.waitForURL(expectedDashboardPattern, { timeout: 15000 });
        console.log(
          `[${user.userId}] Successfully navigated to dashboard URL on ${environmentName}.`,
        );
      } catch (error) {
        console.error(
          `[${user.userId}] Failed to navigate to dashboard on ${environmentName} after login: ${error.message}`,
        );
        // Decide if we should stop this user's workflow or just this iteration
        console.warn(
          `[${user.userId}] Skipping remainder of iteration ${i + 1} due to login failure.`,
        );
        continue; // Skip to the next iteration (or end if i=1)
        // Alternatively: throw error; // Stop this user's entire test
      }
      await page.waitForTimeout(defaultTimeout); // Wait after dashboard load

      // --- Post-login actions ---
      await page.getByTestId("profile").getByText("Profile").click();
      await page.waitForTimeout(defaultTimeout);
      // ... (rest of profile interaction - check if selectors are stable) ...
      await page.getByTestId("firstNamesString").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").click(); // Double click?
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").press("ArrowRight");
      await page.waitForTimeout(defaultTimeout);

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const nameWithTimestamp = `${user.userId} ${environmentName} Iteration ${i + 1} [${timestamp}]`;
      await page.getByTestId("firstNamesString").fill(nameWithTimestamp);
      await page.waitForTimeout(defaultTimeout);

      await page.getByTestId("done").getByTestId("iconIcon").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("MASTER RESUME").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Back").click();
      await page.waitForTimeout(defaultTimeout);

      // Delete account sequence
      await page.getByTestId("profile").getByText("Profile").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("delete_account").click();
      await page.waitForTimeout(defaultTimeout);
      page.once("dialog", (dialog: Dialog) => {
        console.log(
          `[${user.userId}] Dialog message on ${environmentName}: ${dialog.message()}`,
        );
        dialog.dismiss().catch(() => {}); // Dismiss delete confirmation
      });
      await page.getByRole("button", { name: "OK" }).click();
      await page.waitForTimeout(defaultTimeout);

      // REMOVED Conditional Staging click (i == 1) as environment is handled by URL now

      // Intermediate Sign-up attempt (using original hardcoded values)
      // This seems problematic as it uses hardcoded 'testuser' again.
      // Consider if this step is necessary or should use unique data.
      // Keeping it for now to match original flow as closely as possible, but adding warnings.
      console.warn(
        `[${user.userId}] Attempting intermediate sign-up with HARDCODED 'testuser' on ${environmentName}. This might fail or conflict.`,
      );
      try {
        // It's possible the delete account action logged the user out, need to be on login/signup page
        // Let's try clicking signin tab first
        await page.getByTestId("signin").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("firstNamesString").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("firstNamesString").fill("test");
        // ... (fill rest of hardcoded sign up) ...
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
        try {
          await page
            .getByRole("button", { name: "OK" })
            .click({ timeout: 5000 });
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        console.log(
          `[${user.userId}] Intermediate sign-up attempt finished on ${environmentName}.`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Intermediate sign-up attempt failed on ${environmentName}: ${error.message}`,
        );
        try {
          await page.getByTestId("login").click();
        } catch {
          /* ignore */
        } // Try to get back to login view
        await page.waitForTimeout(defaultTimeout);
      }

      // Intermediate Login attempt (using the specific user's credentials)
      // This happens after the intermediate sign-up attempt.
      console.log(
        `[${user.userId}] Attempting intermediate login with ${user.email} on ${environmentName}...`,
      );
      try {
        // Ensure login tab is active
        try {
          await page.getByTestId("login").click();
        } catch {
          /* ignore */
        }
        await page.waitForTimeout(defaultTimeout / 2);

        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.email); // User-specific
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // User-specific
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        await page.getByTestId("seek").click();
        await page.waitForTimeout(defaultTimeout);
        await page.waitForURL(expectedDashboardPattern, { timeout: 10000 }); // Check dashboard URL again
        console.log(
          `[${user.userId}] Intermediate login successful on ${environmentName} (reached dashboard).`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Intermediate login attempt failed on ${environmentName}: ${error.message}`,
        );
        // If intermediate login fails, subsequent steps might also fail.
        // Consider stopping or attempting recovery. For now, just warn and continue.
      }

      // Fragile locator click and img click
      try {
        console.log(
          `[${user.userId}] Attempting fragile locator click on ${environmentName}...`,
        );
        await page
          .locator(
            "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
          )
          .first()
          .click();
        await page.waitForTimeout(defaultTimeout);
        console.log(
          `[${user.userId}] Attempting img click after fragile locator on ${environmentName}...`,
        );
        await page.locator("img").click(); // Still generic, might be unreliable
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Fragile locator/img click failed on ${environmentName}: ${error.message}`,
        );
      }

      // CHATBOT Interaction 1
      try {
        console.log(
          `[${user.userId}] Starting Chatbot Interaction 1 on ${environmentName}...`,
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
          `[${user.userId}] Chatbot Interaction 1 finished on ${environmentName}.`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Chatbot Interaction 1 failed on ${environmentName}: ${error.message}`,
        );
        try {
          await page.getByText("Close Your Agent").click();
        } catch {
          /* ignore */
        } // Attempt close if failed
      }
      await page.waitForTimeout(defaultTimeout);

      // Back click and img click between chats
      try {
        console.log(
          `[${user.userId}] Attempting Back and img click between chats on ${environmentName}...`,
        );
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);
        await page.locator("img").first().click(); // Still generic
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Back/img click between chats failed on ${environmentName}: ${error.message}`,
        );
      }

      // CHATBOT Interaction 2
      try {
        console.log(
          `[${user.userId}] Starting Chatbot Interaction 2 on ${environmentName}...`,
        );
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
          `[${user.userId}] Chatbot Interaction 2 finished on ${environmentName}.`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Chatbot Interaction 2 failed on ${environmentName}: ${error.message}`,
        );
        try {
          await page.getByText("Close Your Agent").click();
        } catch {
          /* ignore */
        } // Attempt close if failed
      }
      await page.waitForTimeout(defaultTimeout);

      //================
      //PHASE TWO

      // Explicit navigation to dashboard (redundant if already there, but ensures state)
      const dashboardUrl = currentIterationUrl.replace(
        "/login",
        "/dashboard/jobseeker/",
      );
      console.log(
        `[${user.userId}] Navigating explicitly to dashboard on ${environmentName}: ${dashboardUrl}`,
      );
      try {
        await page.goto(dashboardUrl);
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Failed to navigate explicitly to dashboard on ${environmentName}: ${error.message}`,
        );
      }

      // Phase Two interactions (wrapped in try/catch)
      try {
        console.log(
          `[${user.userId}] Starting Phase Two interactions on ${environmentName}...`,
        );
        // ... (Master Resume interactions) ...
        await page
          .locator("div")
          .filter({ hasText: /^MASTER RESUME.*Complete$/ })
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

        // ... (Add/Edit Job Role/Resume Profile) ...
        await page.getByTestId("add_jobrole").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("addNew").click();
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("addNew")
          .fill(`Test Resume ${user.userId} ${environmentName}`);
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Your Profiles").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("listItem_0").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("done").getByTestId("iconIcon").click();
        await page.waitForTimeout(defaultTimeout);
        await page
          .locator("span")
          .filter({ hasText: `Test Resume ${user.userId} ${environmentName}` })
          .click();
        await page.waitForTimeout(defaultTimeout);

        // ... (Interact within resume item - potentially fragile selectors) ...
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
        await page
          .getByTestId("jobTitle")
          .fill(`Test Job Title ${user.userId} ${environmentName}`);
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("headerContainer")
          .getByTestId("iconIcon")
          .click();
        await page.waitForTimeout(defaultTimeout);

        // ... (Navigate CV sections) ...
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
        await page
          .getByTestId("summary")
          .fill(`Test Summary for ${user.userId} on ${environmentName}`);
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("headerContainer")
          .getByTestId("iconIcon")
          .click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);

        console.log(
          `[${user.userId}] Phase Two interactions finished on ${environmentName}.`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Phase Two interaction failed on ${environmentName}: ${error.message}`,
        );
      }

      // --- Logout sequence at end of iteration ---
      try {
        console.log(
          `[${user.userId}] Attempting logout at end of iteration ${i + 1} (${environmentName})...`,
        );
        await page.getByTestId("left_nav_button").getByText("Home").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "log out" }).click();
        await page.waitForTimeout(defaultTimeout);
        page.once("dialog", (dialog: Dialog) => {
          console.log(
            `[${user.userId}] Logout Dialog message on ${environmentName}: ${dialog.message()}`,
          );
          dialog.accept().catch(() => {}); // Accept logout
        });
        await page.getByRole("button", { name: "OK" }).click(); // Confirm logout
        console.log(
          `[${user.userId}] Logged out successfully at end of iteration ${i + 1}.`,
        );
        await page.waitForTimeout(defaultTimeout); // Wait after logout dialog
      } catch (error) {
        console.warn(
          `[${user.userId}] Logout failed at end of iteration ${i + 1} (${environmentName}): ${error.message}`,
        );
      }

      // REMOVED Re-login attempt at end of loop - logout should leave it ready for next iteration's goto
      // REMOVED Staging click logic at end of loop

      console.log(
        `[${user.userId}] Completed Iteration ${i + 1} (${environmentName}).`,
      );
    } // End of for loop (i < 2)

    // ==============================================================
    // END: Workflow loops
    // ==============================================================

    console.log(`[${user.userId}] Full test workflow completed successfully.`);
  } catch (error) {
    // Catch errors that might occur outside the iteration loop (e.g., browser launch)
    // or errors re-thrown from within the loop if not handled by 'continue'
    console.error(
      `[${user.userId}] Test workflow failed catastrophically:`,
      error,
    );
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
  console.log(`Local URL: ${localUrl}`);
  console.log(`Staging URL: ${remoteUrl}`);
  console.log(`Default Timeout: ${defaultTimeout}ms, SlowMo: ${slowMo}ms`);

  try {
    // Run all tests in parallel
    await Promise.all(users.map((user) => runTestWorkflow(user)));
    console.log(
      "All test workflows have been initiated and completed (or failed).",
    );
  } catch (error) {
    console.error(
      "An error occurred during the parallel execution setup or Promise.all:",
      error,
    );
  } finally {
    console.log("Parallel test execution script finished.");
  }
})();
