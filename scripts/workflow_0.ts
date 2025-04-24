// filepath: /Users/jobenvy/Documents/UTOPIA/stagehand/scripts/workflow_1.ts
// Copy of single_test.ts for Workflow 0
import { Stagehand } from "../dist/index.js";
import dotenv from "dotenv"; // Ensure @types/dotenv is installed

// Load environment variables from .env file
dotenv.config();

// --- User Credentials ---
const userCredentials = {
  firstname: "test",
  lastname: "user", // Unique last name for this workflow
  email: "test.user@jobenvy.co.uk", // Unique email
  username: "testuser", // Unique username
  password: "testuser",
};
// --- End User Credentials ---

async function run() {
  console.log("Starting Workflow 0"); // Added identifier
  const sh = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    localBrowserLaunchOptions: {
      headless: false,
      //slowMo: 250, // Match helloDashboard's slowMo for exact replication during debugging if needed
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
  const defaultTimeout = targetEnvironment === "REMOTE" ? 2000 : 2000; // Use the same timeout logic as helloDashboard for exact replication
  // --- End Configuration ---

  await page.waitForTimeout(2000); // Match initial wait
  console.log(`Workflow 0 Navigating to: ${targetUrl}`);
  await page.goto(targetUrl);

  // Loop through the workflow twice
  for (let i = 0; i < 2; i++) {
    console.log(`Workflow 0: Starting iteration ${i + 1}`);

    //================
    //PHASE ONE
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").fill(userCredentials.firstname);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").fill(userCredentials.lastname);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").fill(userCredentials.email);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill(userCredentials.username);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill(userCredentials.password);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(defaultTimeout);

    //DEPENDS ON IF ALREADY SIGNUP - Keep try/catch for robustness, but align logic
    try {
      await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
      await page.waitForTimeout(defaultTimeout);
    } catch (error) {
      console.log(
        "Workflow 0: 'OK' button after signup not found or timed out, continuing...",
        error instanceof Error ? error.message : error,
      );
    }

    //THIS CAN FAIL TO SWITCH THE TAB BACK - Keep try/catch for robustness
    try {
      await page.getByTestId("login").click({ timeout: 5000 });
      console.log("Workflow 0: Clicked login tab/button successfully.");
    } catch (error) {
      console.warn(
        "Workflow 0: Could not click login tab/button, continuing execution:",
        error instanceof Error ? error.message : error,
      );
    }

    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill(userCredentials.email); // Assuming email is used for login username
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill(userCredentials.password);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click(); // Login button
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("profile").getByText("Profile").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click(); // Double click? Match helloDashboard
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").press("ArrowRight");
    await page.waitForTimeout(defaultTimeout);

    // Fill in the first name with a timestamp and environment indicator - Match helloDashboard format
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const environmentLabel = i === 0 ? "LOCAL" : "STAGING"; // Determine label based on iteration
    const nameWithTimestamp = `Test ${environmentLabel} [${timestamp}]`; // Use "Test" prefix like helloDashboard
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
      console.log(`Workflow 0 Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {}); // Match helloDashboard: Dismiss the dialog
    });
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(defaultTimeout); // Wait after clicking OK

    // << --- Start: Replicate helloDashboard's post-deletion/staging logic --- >>

    // Staging click for the second iteration (i == 1) - BEFORE the next signin/login block
    if (i == 1) {
      console.log("Workflow 0: Clicking Staging (Iteration 2)");
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Staging").click(); // Assuming 'Staging' text exists and is clickable
      await page.waitForTimeout(defaultTimeout);
    }

    // Replicate the second sign-in/login block from helloDashboard
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("signin").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("firstNamesString").fill(userCredentials.firstname);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("lastNameString").fill(userCredentials.lastname);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("email").fill(userCredentials.email);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill(userCredentials.username);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill(userCredentials.password);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(defaultTimeout);
    try {
      await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
      await page.waitForTimeout(defaultTimeout);
    } catch (error) {
      console.log(
        "Workflow 0: 'OK' button after second signup not found or timed out, continuing...",
        error instanceof Error ? error.message : error,
      );
    }
    await page.getByTestId("username").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("username").fill(userCredentials.email);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("password").fill(userCredentials.password);
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("agree").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByTestId("seek").click();
    await page.waitForTimeout(defaultTimeout);

    // << --- End: Replicate helloDashboard's post-deletion/staging logic --- >>

    // Locator clicks after login - Match helloDashboard
    await page
      .locator(
        "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
      )
      .first()
      .click();
    await page.waitForTimeout(defaultTimeout);
    await page.locator("img").click();
    await page.waitForTimeout(defaultTimeout);

    // CHATBOT Interaction 1 - Keep try/catch but align text if needed
    try {
      await page.getByText("Start A Chat").click({ timeout: 10000 });
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
      await page.waitForTimeout(defaultTimeout);
    } catch (error) {
      console.warn(
        "Workflow 0: Chatbot interaction 1 failed.",
        error instanceof Error ? error.message : error,
      );
    }

    await page.waitForTimeout(defaultTimeout);
    await page.getByText("Back").click();
    await page.waitForTimeout(defaultTimeout);
    await page.locator("img").first().click();
    await page.waitForTimeout(defaultTimeout);

    // CHATBOT Interaction 2 - Keep try/catch but align text and waits
    try {
      await page.getByText("Start A Chat").click({ timeout: 10000 });
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
    } catch (error) {
      console.warn(
        "Workflow 0: Chatbot interaction 2 failed.",
        error instanceof Error ? error.message : error,
      );
    }

    //================
    //PHASE TWO
    console.log("Workflow 0: Starting Phase Two");
    await page.goto("http://localhost:3000/dashboard/jobseeker/");
    await page.waitForTimeout(defaultTimeout);

    await page
      .locator("div")
      .filter({ hasText: /^MASTER RESUME90% Complete$/ })
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

    // Logout - Match helloDashboard
    await page.getByTestId("left_nav_button").getByText("Home").click();
    await page.waitForTimeout(defaultTimeout);
    await page.getByRole("button", { name: "log out" }).click();
    await page.waitForTimeout(defaultTimeout);
    try {
      await page.getByRole("button", { name: "OK" }).click({ timeout: 5000 });
      await page.waitForTimeout(defaultTimeout);
    } catch (error) {
      console.log(
        "Workflow 0: 'OK' button after logout not found or timed out, continuing...",
        error instanceof Error ? error.message : error,
      );
    }

    // << --- Start: Replicate helloDashboard's end-of-loop staging/login logic --- >>

    // Staging click and login for the first iteration (i === 0)
    if (i === 0) {
      console.log(
        "Workflow 0: First iteration complete. Clicking Staging and logging in again.",
      );
      await page.waitForTimeout(defaultTimeout);
      await page.getByText("Staging").click();
      await page.waitForTimeout(defaultTimeout);

      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").fill(userCredentials.email);
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").fill(userCredentials.password);
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("agree").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("seek").click();
      await page.waitForTimeout(defaultTimeout);
      console.log("Workflow 0: Logged back in after Staging click.");
    } else {
      console.log("Workflow 0: Second iteration complete.");
      await page.getByTestId("username").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("username").fill(userCredentials.email);
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("password").fill(userCredentials.password);
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("agree").click();
      await page.waitForTimeout(defaultTimeout);
      await page.getByTestId("seek").click();
      await page.waitForTimeout(defaultTimeout);
      console.log("Workflow 0: Final login after second iteration.");
    }
    // << --- End: Replicate helloDashboard's end-of-loop staging/login logic --- >>
  }

  console.log("Workflow 0 completed twice. Pausing.");
  await page.pause();
}

run().catch((error) => {
  console.error("Workflow 0 failed:", error);
  process.exit(1);
});
