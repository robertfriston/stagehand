// scripts/helloDashboard.ts
import { Stagehand } from "../dist/index.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
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

  // 1) Go to login and sign in (you already have this working)
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(5000);

  await page.click("text=Sign Up");
  await page.waitForTimeout(5000);

  await page.click("text=Log In");
  await page.waitForTimeout(5000);

  await page.getByPlaceholder("username").fill(process.env.TEST_USERNAME!);
  await page.waitForTimeout(5000);

  await page.getByPlaceholder("password").fill(process.env.TEST_PASSWORD!);
  await page.waitForTimeout(5000);

  await page.getByRole("checkbox", { name: /i agree/i }).check();
  await page.waitForTimeout(5000);

  await page.getByRole("button", { name: /job seeker login/i }).click();
  await page.waitForTimeout(5000);

  // 2) OPTIONAL: extract the heading to prove we’re on Dashboard
  // const { heading } = await page.extract({
  //   instruction: "return the main heading text",
  //   schema: z.object({ heading: z.string() }),
  // });
  // console.log("📝 Heading is:", heading);

  //await page.waitForTimeout(5000);

  // === NEW PROFILE FLOW ===

  // 3) Click the Profile button top‑right
  //await page.pause();
  //await page.getByRole("button", { name: /profile/i }).click();
  //await page.waitForTimeout(5000);

  await page.click("text=Profile");
  await page.waitForTimeout(5000);

  // 4) Compute today’s date stamp (DD‑M‑YY)
  // const now = new Date();
  // const dd = now.getDate().toString().padStart(2, "0");
  // const mm = (now.getMonth() + 1).toString().padStart(1, ""); // no leading zero if you prefer
  // const yy = now.getFullYear().toString().slice(-2);
  // const nameWithDate = `Bob [Local] ${dd}-${mm}-${yy}`;

  // 4) Compute today’s date + current 24 hr time stamp
  const now = new Date();

  // Day / month / year
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  // Hours / minutes (24 hr)
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  // Final string: e.g. "Bob [Local] 19-04-25 16:41"
  const nameWithDate = `Bob [Local] ${dd}-${mm}-${yy} ${hh}:${min}`;

  // 5) Fill the First Name field
  //    Adjust the locator if your label text differs slightly
  //await page.getByLabel(/first name/i).fill(nameWithDate);

  await page
    .getByRole("textbox", {
      name: "first name",
    })
    .fill(nameWithDate);

  await page.waitForTimeout(5000);

  // 6) Click the Done button top‑right
  //await page.getByRole("button", { name: /done/i }).click();
  await page.click("text=Done");
  await page.waitForTimeout(5000);

  //await page.click("text=Home");
  await page.getByTestId("left_nav_button").getByText("Home").click();
  await page.waitForTimeout(5000);

  await page.click("text=Done");
  await page.waitForTimeout(5000);

  //await page.getByText("MASTER RESUME VAULT").first().click();

  //await page.click("text=MASTER RESUME VAULT");
  await page.getByTestId("profile_0").click();
  await page.waitForTimeout(5000);

  // 6) Click the Resume button
  //await page.goto('http://localhost:3000/dashboard/jobseeker/jobrole/6765b90cbb5a78be36fac000');
  await page.getByText("cv").click();
  await page.waitForTimeout(5000);
  await page.getByText("resume", { exact: true }).click();
  await page.waitForTimeout(5000);
  await page.getByText("portfolio").click();
  await page.waitForTimeout(5000);
  await page.getByText("View").click();
  await page.waitForTimeout(5000);
  await page.getByText("cv").click();
  await page.waitForTimeout(5000);
  await page.getByText("resume").click();
  await page.waitForTimeout(5000);
  await page.getByText("portfolio").click();
  await page.waitForTimeout(5000);
  await page.getByText("Back").click();
  await page.waitForTimeout(5000);
  await page.locator("img").first().click();
  await page.waitForTimeout(5000);
  await page.getByText("").click();
  await page.waitForTimeout(5000);
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.waitForTimeout(5000);
  await page.getByText("Clear").click();
  await page.waitForTimeout(5000);
  await page.getByText("Chat").nth(2).click();
  await page.waitForTimeout(5000);
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.waitForTimeout(5000);
  await page.getByText("Clear").click();
  await page.waitForTimeout(5000);
  await page
    .locator("div")
    .filter({ hasText: /^Close Your Agent$/ })
    .nth(1)
    .click();
  await page.waitForTimeout(5000);
  await page.getByText("Back").click();
  await page.waitForTimeout(5000);

  //================
  // 7) Pause so you can inspect the final state
  await page.pause();
  // await sh.close();  // re‑enable when you’re ready to auto‑close
}

run().catch(console.error);
