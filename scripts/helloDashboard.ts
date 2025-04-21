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
  //await page.goto("http://localhost:3000/");

  await page.waitForTimeout(2000);

  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(500);
  await page.getByTestId("signin").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").fill("test");
  await page.waitForTimeout(500);
  await page.getByTestId("lastNameString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("lastNameString").fill("user");
  await page.waitForTimeout(500);
  await page.getByTestId("email").click();
  await page.waitForTimeout(500);
  await page.getByTestId("email").fill("test.user@jobenvy.co.uk");
  await page.waitForTimeout(500);
  await page.getByTestId("username").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("password").click();
  await page.waitForTimeout(500);
  await page.getByTestId("password").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("login").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").fill("test.user@jobenvy.co.uk");
  await page.waitForTimeout(500);
  await page.getByTestId("password").click();
  await page.waitForTimeout(500);
  await page.getByTestId("password").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(500);
  await page.getByTestId("seek").click();
  await page.waitForTimeout(500);
  await page.getByTestId("profile").getByText("Profile").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").press("ArrowRight");
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").press("ArrowRight");
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").fill("Test");
  await page.waitForTimeout(500);
  await page.getByTestId("done").getByTestId("iconIcon").click();
  await page.waitForTimeout(500);
  await page.getByText("MASTER RESUME").click();
  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.getByTestId("profile").getByText("Profile").click();
  await page.waitForTimeout(500);
  await page.getByTestId("delete_account").click();
  await page.waitForTimeout(500);
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("signin").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("firstNamesString").fill("test");
  await page.waitForTimeout(500);
  await page.getByTestId("lastNameString").click();
  await page.waitForTimeout(500);
  await page.getByTestId("lastNameString").fill("user");
  await page.waitForTimeout(500);
  await page.getByTestId("email").click();
  await page.waitForTimeout(500);
  await page.getByTestId("email").fill("test.user@jobenvy.co.uk");
  await page.waitForTimeout(500);
  await page.getByTestId("username").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("password").click();
  await page.waitForTimeout(500);
  await page.getByTestId("password").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").fill("test.user@jobenvy.co.uk");
  await page.waitForTimeout(500);
  await page.getByTestId("password").click();
  await page.waitForTimeout(500);
  await page.getByTestId("password").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(500);
  await page.getByTestId("seek").click();
  await page.waitForTimeout(500);
  await page
    .locator(
      "div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div",
    )
    .first()
    .click();
  await page.waitForTimeout(500);
  await page.locator("img").click();
  await page.waitForTimeout(500);

  //CHATBOT
  await page.getByText("Start A Chat").click();
  await page.waitForTimeout(500);
  await page.getByTestId("RNE__Input__text-input").click();
  await page.waitForTimeout(500);
  await page
    .getByTestId("RNE__Input__text-input")
    .fill("hi - help me update my master resume");
  await page.waitForTimeout(5000);
  await page.getByText("").click();
  await page.waitForTimeout(5000);
  await page.getByText("Close Your Agent").click();
  //===================

  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.locator("img").first().click();
  await page.waitForTimeout(500);

  //CHATBOT
  await page.getByText("Start A Chat").click();
  await page.waitForTimeout(5000);
  await page.getByTestId("RNE__Input__text-input").click();
  await page.waitForTimeout(500);
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
  await page.waitForTimeout(500);
  //===================

  //================
  //PHASE TWO

  await page.goto("http://localhost:3000/dashboard/jobseeker/");
  await page.waitForTimeout(500);

  // await page.getByRole("button", { name: "choose your photo..." }).click();
  // await page.waitForTimeout(500);
  // await page.getByText("Add to Gallery").click();
  // await page.waitForTimeout(500);
  // await page
  //   .locator("div")
  //   .filter({ hasText: /^Add to Gallery$/ })
  //   .first()
  //   .setInputFiles("bob.jpg");
  // await page.waitForTimeout(500);
  // await page.getByRole("button", { name: " Upload" }).click();
  // await page.waitForTimeout(500);
  // await page.getByText("Close").click();
  //await page.waitForTimeout(500);

  await page
    .locator("div")
    .filter({ hasText: /^MASTER RESUME90% Complete$/ })
    .getByTestId("listItemTitle")
    .click();
  await page.waitForTimeout(500);
  await page.getByText("").nth(1).click();
  await page.waitForTimeout(500);
  await page.getByText("resume", { exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByText("portfolio").click();
  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.getByTestId("add_jobrole").click();
  await page.waitForTimeout(500);
  await page.getByTestId("addNew").click();
  await page.waitForTimeout(500);
  await page.getByTestId("addNew").fill("Test Resume");
  await page.waitForTimeout(500);
  await page.getByText("Your Profiles").click();
  await page.waitForTimeout(500);
  await page.getByTestId("listItem_0").click();
  await page.waitForTimeout(500);
  await page.getByTestId("done").getByTestId("iconIcon").click();
  await page.waitForTimeout(500);
  await page.locator("span").filter({ hasText: "Test Resume" }).click();
  await page.waitForTimeout(500);
  await page
    .locator("div")
    .filter({ hasText: /^Not Assigned$/ })
    .nth(3)
    .click();
  await page.waitForTimeout(500);
  await page
    .locator(
      "div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div > div > div > div > div",
    )
    .first()
    .click();
  await page.waitForTimeout(500);
  await page.getByTestId("jobTitle").click();
  await page.waitForTimeout(500);
  await page.getByTestId("jobTitle").fill("Test Job Title");
  await page.waitForTimeout(500);
  await page.getByTestId("headerContainer").getByTestId("iconIcon").click();
  await page.waitForTimeout(500);
  await page.getByText("cv").click();
  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.getByText("Curriculum Vitae", { exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByText("Summary").click();
  await page.waitForTimeout(500);
  await page.getByTestId("summary").click();
  await page.waitForTimeout(500);
  await page.getByTestId("summary").fill("Test Summary");
  await page.waitForTimeout(500);
  await page.getByTestId("headerContainer").getByTestId("iconIcon").click();
  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.getByText("Back").click();
  await page.waitForTimeout(500);
  await page.getByTestId("left_nav_button").getByText("Home").click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "log out" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").click();
  await page.waitForTimeout(500);
  await page.getByTestId("username").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("password").click();
  await page.waitForTimeout(500);
  await page.getByTestId("password").fill("testuser");
  await page.waitForTimeout(500);
  await page.getByTestId("agree").click();
  await page.waitForTimeout(500);
  await page.getByTestId("seek").click();
  await page.waitForTimeout(500);

  //================
  // 7) Pause so you can inspect the final state
  await page.pause();
  // await sh.close();  // re‑enable when you’re ready to auto‑close
}

run().catch(console.error);
