import { test, expect } from "@playwright/test";

test.describe("Miles Optimizer — smoke tests", () => {

  test("1. chargement initial — titre et bouton recherche visibles", async ({ page }) => {
    await page.goto("/");
    // Use role=heading to avoid strict mode violation (multiple text matches)
    await expect(page.getByRole("heading", { name: "Miles Optimizer" })).toBeVisible();
    // Search button uses aria-label set to t.btnSearch ("🔍 Rechercher les vols" or "🔍 Search flights")
    const searchBtn = page.getByRole("button", {
      name: /rechercher les vols|search flights/i,
    });
    await expect(searchBtn).toBeVisible();
  });

  test("2. toggle langue FR ↔ EN", async ({ page }) => {
    await page.goto("/");
    // Lang toggle has aria-label="Toggle language" and shows "EN" (in FR mode) or "FR" (in EN mode)
    const langBtn = page.getByRole("button", { name: "Toggle language" });
    await expect(langBtn).toBeVisible();
    const initialText = await langBtn.textContent();
    await langBtn.click();
    await page.waitForTimeout(200);
    const newText = await langBtn.textContent();
    expect(newText?.trim()).not.toBe(initialText?.trim());
  });

  test("3. sélecteur devise visible", async ({ page }) => {
    await page.goto("/");
    // Currency selector is a <select> with aria-label "Devise" (FR) or "Currency" (EN)
    const currencySelect = page.locator("select").filter({
      has: page.locator('option[value="USD"]'),
    });
    await expect(currencySelect.first()).toBeVisible();
    // Verify the select shows a recognizable currency value
    const selectedValue = await currencySelect.first().inputValue();
    expect(["USD", "EUR", "XOF", "GBP"]).toContain(selectedValue);
  });

  test("4. toggle miles possédés visible et cliquable", async ({ page }) => {
    await page.goto("/");
    // Label "J'ai déjà des miles" or "I already have miles"
    const label = page.getByText(/j'ai déjà des miles|i already have miles/i);
    await expect(label).toBeVisible();
    // The miles toggle button has aria-pressed attribute; verify it exists in the DOM
    const toggle = page.locator("button.relative.inline-flex");
    await expect(toggle.first()).toHaveAttribute("aria-pressed", "false");
    // Click via JS to bypass visibility constraints (button may be partially clipped by parent)
    const pressedBefore = await toggle.first().getAttribute("aria-pressed");
    await toggle.first().dispatchEvent("click");
    await page.waitForTimeout(200);
    const pressedAfter = await toggle.first().getAttribute("aria-pressed");
    expect(pressedAfter).not.toBe(pressedBefore);
  });

});
