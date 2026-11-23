import { type Browser, expect, type Page, test } from "@playwright/test";

const run = Date.now().toString(36);

async function signUp(browser: Browser, name: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Username").fill(`${name.toLowerCase()}_${run}`);
  await page.getByLabel("Email").fill(`${name.toLowerCase()}_${run}@e2e.local`);
  await page.getByLabel("Password").fill("e2e-password-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/today$/);
  return page;
}

test("daily loop: sign up, check in, share to the global thread, streak updates", async ({ browser }) => {
  const page = await signUp(browser, "Ada");
  await expect(page.getByText("Grab your Bible.")).toBeVisible();
  await expect(page.getByText("0 / 3")).toBeVisible();

  await page.getByRole("button", { name: "I read it" }).click();
  await expect(page.getByText("✓ Read today")).toBeVisible();
  await expect(page.getByText("1 / 3")).toBeVisible();

  const reflection = `Smoke test reflection ${run}`;
  await page.getByLabel("Your reflection").fill(reflection);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Shared ✓")).toBeVisible();
  await expect(page.locator("article", { hasText: reflection })).toBeVisible();
});

test("private group: hidden from outsiders until they use an invite", async ({ browser }) => {
  const owner = await signUp(browser, "Owen");
  await owner.goto("/groups/new");
  await owner.getByLabel("Name").fill(`E2E Group ${run}`);
  await owner.getByLabel(/Private/).check();
  await owner.getByRole("button", { name: "Create group" }).click();
  await expect(owner.getByRole("heading", { name: `E2E Group ${run}` })).toBeVisible();
  const groupUrl = owner.url();

  const secret = `Members-only post ${run}`;
  await owner.getByPlaceholder(/Share a prayer request/).fill(secret);
  await owner.getByRole("button", { name: "Post", exact: true }).click();
  await expect(owner.locator("article", { hasText: secret })).toBeVisible();

  await owner.goto(`${groupUrl}/settings`);
  await owner.getByRole("button", { name: "Create invite link" }).click();
  const invite = await owner.locator("code").first().textContent();
  expect(invite).toContain("/invite/");

  const friend = await signUp(browser, "Fern");
  await friend.goto(groupUrl);
  await expect(friend.getByText(secret)).toHaveCount(0);
  await expect(friend.getByText("This page could not be found.")).toBeVisible();

  await friend.goto(invite!);
  await friend.getByRole("button", { name: "Join group" }).click();
  await expect(friend.locator("article", { hasText: secret })).toBeVisible();
});
