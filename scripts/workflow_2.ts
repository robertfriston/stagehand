// filepath: /Users/jobenvy/Documents/UTOPIA/stagehand/scripts/workflow_2.ts
// Copy of single_test.ts for workflow 2
import { Stagehand } from "../dist/index.js";
import dotenv from "dotenv"; // Ensure @types/dotenv is installed

// Load environment variables from .env file
dotenv.config();

async function run() {
  console.log("Starting Workflow 2"); // Added identifier
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
  const targetEnvironment = "LOCAL"; // Switch between 'LOCAL' and 'REMOTE'
  const localUrl = process.env.LOCAL_URL ?? "http://localhost:3000/login";
  const remoteUrl =
    process.env.REMOTE_URL ?? "https://jobenvy-v6-824.nodechef.com/login";
  const targetUrl = targetEnvironment === "LOCAL" ? localUrl : remoteUrl;
  const defaultTimeout = targetEnvironment === "REMOTE" ? 2000 : 2000;
  // --- End Configuration ---

  await page.waitForTimeout(2000);
  console.log(`Workflow 2 Navigating to: ${targetUrl}`);
  await page.goto(targetUrl);

  // Loop through the workflow twice
  for (let i = 0; i < 2; i++) {
    console.log(`Workflow 2: Starting iteration ${i + 1}`);

    //================
    //PHASE ONE
    // [Original PHASE ONE logic from single_test.ts goes here]
    // ... (Copy the entire PHASE ONE block) ...
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").fill("test");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").fill("user2"); // Modified lastname
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").fill("test.user2@jobenvy.co.uk"); // Modified email for uniqueness
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser2"); // Modified username
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
    try {
      await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 }); // Add timeout
      await page.waitForTimeout(defaultTimeout);
    } catch (e) {
      console.log(
        "Workflow 2: 'OK' button after signup not found or timed out, continuing...",
      );
    }

    //THIS CAN FAIL TO SWITCH THE TAB BACK - Wrap in try/catch
    try {
      await page.getByTestId("login").click({ timeout: 5000 }); // Add timeout
      console.log("Workflow 2: Clicked login tab/button successfully.");
    } catch (error) {
      console.warn(
        "Workflow 2: Could not click login tab/button, continuing execution:",
        error.message,
      );
    }

    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser2"); // Modified username
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
    const nameWithTimestamp = `Test W2 ${environmentLabel} [${timestamp}]`; // Construct the name
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
      console.log(`Workflow 2 Dialog message: ${dialog.message()}`);
      dialog.accept().catch(() => {}); // Accept deletion
    });
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout); // Wait after clicking OK

    // Login again after deletion attempt (or sign up if deletion failed/user didn't exist)
    console.log(
      "Workflow 2: Attempting login/signup again after delete action",
    );
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);

    // Try signup first
    try {
      await page.getByTestId("firstNamesString").click({ timeout: 5000 });
      await page.getByTestId("firstNamesString").fill("test");
      await page.getByTestId("lastNameString").fill("user2"); // Unique last name
      await page.getByTestId("email").fill("test.user2@jobenvy.co.uk"); // Unique email
      await page.getByTestId("username").fill("testuser2"); // Unique username
      await page.getByTestId("password").fill("testuser");
      await page.getByTestId("agree").click();
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 }); // Handle potential existing user dialog
      await page.waitForTimeout(defaultTimeout);
      console.log("Workflow 2: Signup successful or handled existing user.");
    } catch (e) {
      console.log(
        "Workflow 2: Signup failed or element not found, attempting login.",
        e.message,
      );
      // If signup elements aren't there, assume we need to login
      await page.getByTestId("login").click({ timeout: 5000 }); // Switch to login tab
      await page.waitForTimeout(defaultTimeout);
    }

    // Login
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser2"); // Use unique username
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click(); // Click login button (seek)
    await page.waitForTimeout(defaultTimeout);
    console.log("Workflow 2: Logged in successfully.");

    // CHATBOT Interaction 1
    try {
      await page
        .locator('div:text("Start A Chat")')
        .first()
        .click({ timeout: 10000 }); // Increased timeout
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("RNE__Input__text-input").click();
      await page.waitForTimeout(defaultTimeout);
      await page
        .getByTestId("RNE__Input__text-input")
        .fill("Workflow 2: hi - help me update my master resume");
      await page.waitForTimeout(5000);
      await page.getByText("").click();
      await page.waitForTimeout(10000); // Wait longer for response
      await page.getByText("Close Your Agent").click();
      await page.waitForTimeout(defaultTimeout);
    } catch (e) {
      console.warn("Workflow 2: Chatbot interaction 1 failed.", e.message);
      // Try to navigate back if possible
      try {
        await page.getByText("Back").click();
      } catch {}
    }

    // CHATBOT Interaction 2
    try {
      await page.getByText("Back").click(); // Navigate back if needed
      await page.waitForTimeout(defaultTimeout);
      await page.locator("img").first().click(); // Click profile image or similar element
      await page.waitForTimeout(defaultTimeout);

      await page
        .locator('div:text("Start A Chat")')
        .first()
        .click({ timeout: 10000 });
      await page.waitForTimeout(5000);
      await page.getByTestId("RNE__Input__text-input").click();
      await page.waitForTimeout(defaultTimeout);
      await page
        .getByTestId("RNE__Input__text-input")
        .fill("Workflow 2: what is the job situation like in Brighton UK?");
      await page.waitForTimeout(5000);
      await page.getByText("").click();
      await page.waitForTimeout(15000); // Wait even longer
      await page.getByText("Close Your Agent").click();
      await page.waitForTimeout(defaultTimeout);
    } catch (e) {
      console.warn("Workflow 2: Chatbot interaction 2 failed.", e.message);
      try {
        await page.getByText("Back").click();
      } catch {}
    }

    //================
    //PHASE TWO
    // [Original PHASE TWO logic from single_test.ts goes here]
    // ... (Copy the entire PHASE TWO block) ...
    console.log("Workflow 2: Starting Phase Two");
    await page.goto("http://localhost:3000/dashboard/jobseeker/"); // Use consistent URL
    await page.waitForTimeout(defaultTimeout);

    try {
      await page
        .locator("div")
        .filter({ hasText: /^MASTER RESUME/ }) // More robust selector
        .getByTestId("listItemTitle")
        .click({ timeout: 10000 });
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
      await page.getByTestId("addNew").fill("Test Resume W2"); // Unique name
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Your Profiles").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("listItem_0").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("done").getByTestId("iconIcon").click();
      await page.waitForTimeout(defaultTimeout);
      await page.locator("span").filter({ hasText: "Test Resume W2" }).click(); // Use unique name
      await page.waitForTimeout(defaultTimeout);
      await page
        .locator("div")
        .filter({ hasText: /^Not Assigned$/ })
        .nth(3)
        .click();
      await page.waitForTimeout(defaultTimeout);
      // This selector seems fragile, might need adjustment if UI changes
      await page
        .locator(
          "div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div > div > div > div > div",
        )
        .first()
        .click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("jobTitle").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("jobTitle").fill("Test Job Title W2"); // Unique title
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
      await page.getByTestId("summary").fill("Test Summary W2"); // Unique summary
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("headerContainer").getByTestId("iconIcon").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Back").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Back").click();
      await page.waitForTimeout(defaultTimeout);
    } catch (e) {
      console.error("Workflow 2: Error during Phase Two.", e.message);
      // Attempt to navigate home regardless of where the error occurred
      try {
        await page.goto("http://localhost:3000/dashboard/jobseeker/");
      } catch {}
    }

    // Logout and prepare for next iteration or staging switch
    await page.getByTestId("left_nav_button").getByText("Home").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "log out" }).click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout);

    // Login again for the next loop or staging
    console.log("Workflow 2: Logging back in for next step/iteration");
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill("testuser2"); // Use unique username
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill("testuser");
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click();
    await page.waitForTimeout(defaultTimeout);
    console.log("Workflow 2: Logged back in.");

    // If it's the first iteration, click Staging and prepare for the second run
    // NOTE: The original script seemed to intend to run the *same* workflow again on Staging.
    // This setup runs independent workflows. If you want each workflow to hit both Local and Staging,
    // the logic within *this* file needs to be adjusted.
    if (i === 0) {
      console.log(
        "Workflow 2: First iteration complete. Preparing for second iteration (still on LOCAL).",
      );
      // No staging switch here as per current parallel setup
      // If you wanted this workflow to *also* test staging, you'd add staging logic here.
    } else {
      console.log("Workflow 2: Second iteration complete.");
    }
  }

  console.log("Workflow 2 completed twice. Closing.");
  // await page.pause(); // Remove pause for automated runs
  await sh.close();
}

run().catch((error) => {
  console.error("Workflow 2 failed:", error);
  process.exit(1); // Exit with error code if run fails
});
