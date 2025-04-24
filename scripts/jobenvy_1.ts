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

// --- Configuration (adapted from helloDashboard.ts) ---
const targetEnvironment = process.env.TARGET_ENV ?? "LOCAL"; // Use TARGET_ENV or default to LOCAL
const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login";
const remoteUrl =
  process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login";
const targetUrl = targetEnvironment === "LOCAL" ? localUrl : remoteUrl;

// Set timeout based on environment - consider if slowMo affects this need
// Using original timeout value from helloDashboard
const defaultTimeout = targetEnvironment === "REMOTE" ? 2000 : 2000;
const slowMo = 250; // Keep slowMo for visibility
// --- End Configuration ---

// REMOVED performCoreWorkflow function

// The main function that runs the test for a given user
// This function now contains the *entire* workflow from helloDashboard's run()
async function runTestWorkflow(user: {
  userId: string;
  email: string; // Primary email for successful login
  password: string; // Primary password for successful login
}) {
  console.log(`[${user.userId}] Starting full test workflow...`);
  let browser; // Declare browser outside try block

  try {
    browser = await chromium.launch({
      headless: false, // Keep the browser visible
      slowMo: slowMo, // Use configured slowMo
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the login page (initial navigation)
    console.log(`[${user.userId}] Navigating to: ${targetUrl}`);
    await page.goto(targetUrl);
    await page.waitForTimeout(defaultTimeout); // Wait for page load

    // ==============================================================
    // START: Exact workflow from helloDashboard.ts run() function
    // (excluding Stagehand setup and initial goto which is done above)
    // ==============================================================

    // Loop through the workflow twice (as in original)
    for (let i = 0; i < 2; i++) {
      console.log(`[${user.userId}] Starting workflow iteration ${i + 1}`);

      //================
      //PHASE ONE

      await page.waitForTimeout(defaultTimeout);
      // --- Sign-up attempt (using original hardcoded values) ---
      await page.getByTestId("signin").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").fill("test"); // Original value
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("lastNameString").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("lastNameString").fill("user"); // Original value
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("email").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("email").fill("test.user@jobenvy.co.uk"); // Original value
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").fill("testuser"); // Original value
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").fill("testuser"); // Original value
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("agree").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.waitForTimeout(defaultTimeout);

      //DEPENDS ON IF ALREADY SIGNUP (handle potential dialog/message)
      try {
        await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 }); // Shorter timeout for optional element
        console.log(`[${user.userId}] Clicked OK after sign-up attempt.`);
        await page.waitForTimeout(defaultTimeout);
      } catch {
        console.log(
          `[${user.userId}] OK button after sign-up not found or timed out, continuing.`,
        );
      }

      //THIS CAN FAIL TO SWITCH THE TAB BACK - Wrap in try/catch
      try {
        await page.getByTestId("login").click();
        console.log(`[${user.userId}] Clicked login tab/button successfully.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Could not click login tab/button, continuing execution:`,
          error.message,
        );
      }
      await page.waitForTimeout(defaultTimeout); // Wait even if click failed

      // --- Primary Login attempt (using the specific user's credentials) ---
      console.log(
        `[${user.userId}] Attempting primary login with email: ${user.email}`,
      );
      await page.getByTestId("username").click(); // Ensure focus
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("username").fill(user.email); // Use user-specific email
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click(); // Ensure focus
      await page.waitForTimeout(defaultTimeout / 2);
      await page.getByTestId("password").fill(user.password); // Use user-specific password
      await page.waitForTimeout(defaultTimeout);
      // Assuming 'agree' might still be needed before 'seek' based on original flow
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
      // Add a wait for navigation/dashboard element after successful login
      try {
        await page.waitForURL(/dashboard/, { timeout: 15000 });
        console.log(
          `[${user.userId}] Successfully navigated to dashboard URL.`,
        );
      } catch (error) {
        console.error(
          `[${user.userId}] Failed to navigate to dashboard after login: ${error.message}`,
        );
        throw error; // Re-throw error if login fails, stopping this user's workflow
      }
      await page.waitForTimeout(defaultTimeout); // Wait after dashboard load

      // --- Start of post-login actions from original script ---
      await page.getByTestId("profile").getByText("Profile").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("firstNamesString").press("ArrowRight");
      await page.waitForTimeout(defaultTimeout);

      // Fill in the first name with a timestamp and user/iteration indicator
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      // Use userId and iteration number
      const nameWithTimestamp = `${user.userId} Iteration ${i + 1} [${timestamp}]`;
      await page.getByTestId("firstNamesString").fill(nameWithTimestamp);
      await page.waitForTimeout(defaultTimeout);

      await page.getByTestId("done").getByTestId("iconIcon").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("MASTER RESUME").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Back").click();
      await page.waitForTimeout(defaultTimeout);

      // Delete account sequence (as in original)
      await page.getByTestId("profile").getByText("Profile").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("delete_account").click();
      await page.waitForTimeout(defaultTimeout);
      page.once("dialog", (dialog: Dialog) => {
        // Added Dialog type
        console.log(`[${user.userId}] Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
      });
      await page.getByRole("button", { name: "OK" }).click();
      await page.waitForTimeout(defaultTimeout); // Added wait after OK click

      // Conditional Staging click (only on second iteration, i=1)
      if (i == 1) {
        console.log(`[${user.userId}] Iteration 2: Clicking Staging.`);
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Staging").click(); // This might navigate away or change state
        await page.waitForTimeout(defaultTimeout);
        // NOTE: The original script immediately tries another sign-up/login after this.
        // Ensure the UI state after clicking "Staging" allows for the next steps.
      }

      // Intermediate Sign-up attempt (using original hardcoded values)
      // This block seems redundant if the user is already logged in, but replicating original flow.
      // It might fail depending on the state after the previous actions / Staging click.
      console.log(`[${user.userId}] Attempting intermediate sign-up...`);
      try {
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
        // Handle potential OK button again
        try {
          await page
            .getByRole("button", { name: "OK" })
            .click({ timeout: 5000 });
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        console.log(`[${user.userId}] Intermediate sign-up attempt finished.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Intermediate sign-up attempt failed: ${error.message}`,
        );
        // Attempt to recover by ensuring login tab is visible for next step
        try {
          await page.getByTestId("login").click();
        } catch {
          /* ignore */
        }
        await page.waitForTimeout(defaultTimeout);
      }

      // Intermediate Login attempt (using the specific user's credentials)
      // This also seems redundant/potentially problematic depending on state. Replicating original.
      console.log(`[${user.userId}] Attempting intermediate login...`);
      try {
        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.email); // Use user-specific email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user-specific password
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        await page.getByTestId("seek").click();
        await page.waitForTimeout(defaultTimeout); // Wait after seek
        // Check if dashboard is reached again
        await page.waitForURL(/dashboard/, { timeout: 10000 });
        console.log(
          `[${user.userId}] Intermediate login successful (reached dashboard).`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Intermediate login attempt failed: ${error.message}`,
        );
        // If intermediate login fails, the subsequent steps might also fail.
        // Consider if the script should stop here for this user or try to continue.
      }

      // Fragile locator click and img click (as in original)
      try {
        console.log(`[${user.userId}] Attempting fragile locator click...`);
        await page
          .locator(
            "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
          )
          .first()
          .click();
        await page.waitForTimeout(defaultTimeout);
        console.log(
          `[${user.userId}] Attempting img click after fragile locator...`,
        );
        await page.locator("img").click(); // Which image? Using original generic selector.
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Fragile locator/img click failed: ${error.message}`,
        );
      }

      // CHATBOT Interaction 1
      try {
        console.log(`[${user.userId}] Starting Chatbot Interaction 1...`);
        await page.getByText("Start A Chat").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("RNE__Input__text-input").click();
        await page.waitForTimeout(defaultTimeout);
        await page
          .getByTestId("RNE__Input__text-input")
          .fill(`hi from ${user.userId} - help me update my master resume`); // Use userId
        await page.waitForTimeout(5000); // Wait for potential response/processing
        await page.getByText("").click(); // Send button
        await page.waitForTimeout(5000); // Wait again
        await page.getByText("Close Your Agent").click();
        console.log(`[${user.userId}] Chatbot Interaction 1 finished.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Chatbot Interaction 1 failed: ${error.message}`,
        );
        try {
          await page.getByText("Close Your Agent").click();
        } catch {
          /* ignore */
        }
      }
      await page.waitForTimeout(defaultTimeout); // Wait after closing chat

      // Back click and img click between chats (as in original)
      try {
        console.log(
          `[${user.userId}] Attempting Back and img click between chats...`,
        );
        await page.getByText("Back").click();
        await page.waitForTimeout(defaultTimeout);
        await page.locator("img").first().click(); // Which image? Using original generic selector.
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Back/img click between chats failed: ${error.message}`,
        );
      }

      // CHATBOT Interaction 2
      try {
        console.log(`[${user.userId}] Starting Chatbot Interaction 2...`);
        await page.getByText("Start A Chat").click();
        await page.waitForTimeout(5000); // Longer wait before interacting
        await page.getByTestId("RNE__Input__text-input").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("RNE__Input__text-input").fill(
          `what is the job situation like in Brighton UK for software engineering roles? [User: ${user.userId}]`, // Use userId
        );
        await page.waitForTimeout(5000); // Wait
        await page.getByText("").click(); // Send button
        await page.waitForTimeout(15000); // Longer wait for response (original had 3x 5000ms)
        await page.getByText("Close Your Agent").click();
        console.log(`[${user.userId}] Chatbot Interaction 2 finished.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Chatbot Interaction 2 failed: ${error.message}`,
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
      const dashboardUrl = targetUrl.replace("/login", "/dashboard/jobseeker/");
      console.log(
        `[${user.userId}] Navigating explicitly to dashboard: ${dashboardUrl}`,
      );
      try {
        await page.goto(dashboardUrl);
        await page.waitForTimeout(defaultTimeout);
      } catch (error) {
        console.warn(
          `[${user.userId}] Failed to navigate explicitly to dashboard: ${error.message}`,
        );
        // Continue anyway, maybe already there?
      }

      try {
        // Wrap Phase Two interactions
        console.log(`[${user.userId}] Starting Phase Two interactions...`);
        // Interact with Master Resume section (using original selector)
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
        await page.getByTestId("addNew").fill(`Test Resume ${user.userId}`); // Use userId
        await page.waitForTimeout(defaultTimeout);
        await page.getByText("Your Profiles").click(); // Navigate back or confirm? Check UI flow.
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("listItem_0").click(); // Select the first item (assuming it's the new one)
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("done").getByTestId("iconIcon").click(); // Save/confirm
        await page.waitForTimeout(defaultTimeout);
        await page
          .locator("span")
          .filter({ hasText: `Test Resume ${user.userId}` }) // Use userId
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
        await page
          .getByTestId("jobTitle")
          .fill(`Test Job Title ${user.userId}`); // Use userId
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
        await page
          .getByTestId("summary")
          .fill(`Test Summary for ${user.userId}`); // Use userId
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

        console.log(`[${user.userId}] Phase Two interactions finished.`);
      } catch (error) {
        console.warn(
          `[${user.userId}] Phase Two interaction failed: ${error.message}`,
        );
      }

      // --- Logout sequence at end of iteration (as in original) ---
      try {
        console.log(
          `[${user.userId}] Attempting logout at end of iteration ${i + 1}...`,
        );
        await page.getByTestId("left_nav_button").getByText("Home").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByRole("button", { name: "log out" }).click();
        await page.waitForTimeout(defaultTimeout);
        page.once("dialog", (dialog: Dialog) => {
          // Added Dialog type
          console.log(
            `[${user.userId}] Logout Dialog message: ${dialog.message()}`,
          );
          dialog.accept().catch(() => {}); // Accept logout confirmation
        });
        await page.getByRole("button", { name: "OK" }).click(); // Assuming OK confirms logout
        console.log(
          `[${user.userId}] Logged out successfully at end of iteration ${i + 1}.`,
        );
        await page.waitForTimeout(defaultTimeout); // Wait after logout
      } catch (error) {
        console.warn(
          `[${user.userId}] Logout failed at end of iteration ${i + 1}: ${error.message}`,
        );
      }

      // --- Logic for second iteration prep (Staging click and re-login prep) ---
      // This block is from the *end* of the original loop, preparing for the next iteration or finishing.

      // Staging click (again?) and re-login with original hardcoded credentials
      // This seems highly specific to the original script's two-stage test. Replicating exactly.
      if (i == 1) {
        // This was inside the main block before, now checking again at the end? Check original logic.
        // The original had `if (i == 1)` block *before* the intermediate signup/login.
        // It also had `if (i === 0)` block at the very end to click Staging and logout/relogin.
        // Let's stick to the `if (i === 0)` block at the end for preparing iteration 2.
        console.log(`[${user.userId}] End of Iteration 2 reached.`);
      }

      // Re-login attempt with the specific user's credentials (as in original loop end)
      // This seems intended to reset state or test login again after logout.
      console.log(
        `[${user.userId}] Attempting re-login with user credentials at end of iteration ${i + 1}...`,
      );
      try {
        // Need to ensure we are on login page after logout
        // await page.goto(targetUrl); // Optional: Force navigation back to login?
        // await page.waitForTimeout(defaultTimeout);

        await page.getByTestId("username").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("username").fill(user.email); // Use user-specific email
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").click();
        await page.waitForTimeout(defaultTimeout);
        await page.getByTestId("password").fill(user.password); // Use user-specific password
        await page.waitForTimeout(defaultTimeout);
        try {
          await page.getByTestId("agree").click();
          await page.waitForTimeout(defaultTimeout);
        } catch {
          /* ignore */
        }
        await page.getByTestId("seek").click();
        await page.waitForTimeout(defaultTimeout); // Wait after seek
        // Check if dashboard is reached again
        await page.waitForURL(/dashboard/, { timeout: 10000 });
        console.log(
          `[${user.userId}] Re-login at end of iteration ${i + 1} successful.`,
        );
      } catch (error) {
        console.warn(
          `[${user.userId}] Re-login attempt at end of iteration ${i + 1} failed: ${error.message}`,
        );
        // If this fails, the next iteration (if any) might start in a bad state.
      }

      // If it's the first iteration (i === 0), click Staging and prepare for the second run (as in original)
      if (i === 0) {
        console.log(
          `[${user.userId}] First iteration complete. Clicking Staging and logging out/in again for Iteration 2.`,
        );

        // Logout before clicking staging (as per original end-of-loop logic)
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
        } catch (error) {
          console.warn(
            `[${user.userId}] Logout before Staging click failed: ${error.message}`,
          );
        }

        // Click Staging
        try {
          await page.waitForTimeout(defaultTimeout);
          await page.getByText("Staging").click();
          await page.waitForTimeout(defaultTimeout);
          console.log(`[${user.userId}] Clicked Staging.`);
          // The next iteration will start from the top of the loop,
          // attempting sign-up, then primary login with user credentials.
        } catch (error) {
          console.warn(
            `[${user.userId}] Clicking Staging failed: ${error.message}`,
          );
          // If Staging click fails, the second iteration might run against the wrong environment/state.
        }
      } else {
        console.log(`[${user.userId}] Second iteration complete.`);
      }
    } // End of for loop (i < 2)

    // ==============================================================
    // END: Exact workflow from helloDashboard.ts run() function
    // ==============================================================

    console.log(`[${user.userId}] Full test workflow completed successfully.`);
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
    console.log(
      "All test workflows have been initiated and completed (or failed).",
    );
  } catch (error) {
    // This catch might not be reached if errors are handled within runTestWorkflow
    console.error(
      "An error occurred during the parallel execution setup or Promise.all:",
      error,
    );
  } finally {
    console.log("Parallel test execution script finished.");
  }
})();
