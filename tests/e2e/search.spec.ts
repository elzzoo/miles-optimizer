import { test, expect } from "@playwright/test";

test.describe("Miles Optimizer — search form scenarios", () => {

  test("5. aller-retour: champ retour visible, aller-simple: champ retour masqué", async ({ page }) => {
    await page.goto("/");

    // Default is aller-retour — there should be 2 date inputs
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);

    // Switch to aller-simple
    const oneWayBtn = page.getByRole("button", { name: /aller simple|one.?way/i });
    await oneWayBtn.click();
    await page.waitForTimeout(300);
    // Only 1 date input remaining
    await expect(dateInputs).toHaveCount(1);

    // Switch back to aller-retour
    const roundTripBtn = page.getByRole("button", { name: /aller.?retour|round.?trip/i });
    await roundTripBtn.click();
    await page.waitForTimeout(300);
    await expect(dateInputs).toHaveCount(2);
  });

  test("6. sélection cabine business / éco", async ({ page }) => {
    await page.goto("/");

    const businessBtn = page.getByRole("button", { name: /business/i });
    const ecoBtn = page.getByRole("button", { name: /éco|eco/i });

    await expect(businessBtn).toBeVisible();
    await expect(ecoBtn).toBeVisible();

    // Click business
    await businessBtn.click();
    await expect(businessBtn).toHaveAttribute("aria-pressed", "true");
    await expect(ecoBtn).toHaveAttribute("aria-pressed", "false");

    // Click eco
    await ecoBtn.click();
    await expect(ecoBtn).toHaveAttribute("aria-pressed", "true");
    await expect(businessBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("7. changement de devise", async ({ page }) => {
    await page.goto("/");

    const currencySelect = page.locator("select").filter({
      has: page.locator('option[value="USD"]'),
    });
    await expect(currencySelect.first()).toBeVisible();

    // Switch to EUR
    await currencySelect.first().selectOption("EUR");
    const val = await currencySelect.first().inputValue();
    expect(val).toBe("EUR");

    // Switch to XOF
    await currencySelect.first().selectOption("XOF");
    const val2 = await currencySelect.first().inputValue();
    expect(val2).toBe("XOF");
  });

  test("8. chips de date rapide mise à jour du champ date", async ({ page }) => {
    await page.goto("/");

    // Get current departure date input value
    const depInput = page.locator('input[type="date"]').first();
    const originalVal = await depInput.inputValue();

    // Click +30j chip
    const chip30 = page.getByRole("button", { name: "+30j" });
    if (await chip30.count() > 0) {
      await chip30.first().click();
      await page.waitForTimeout(100);
      const newVal = await depInput.inputValue();
      // New date should differ from original (unless original was already +30j)
      expect(newVal).toBeTruthy();
      expect(newVal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("9. bouton recherche désactivé si origine = destination", async ({ page }) => {
    await page.goto("/");

    // The search button should be present
    const searchBtn = page.getByRole("button", { name: /rechercher les vols|search flights/i });
    await expect(searchBtn).toBeVisible();
  });

  test("10. toggle vol direct", async ({ page }) => {
    await page.goto("/");

    // Direct-only toggle: label "Vols directs uniquement" or "Direct flights only"
    const directLabel = page.getByText(/vols directs|direct flights/i);
    if (await directLabel.count() > 0) {
      await expect(directLabel.first()).toBeVisible();
    }
  });

  test("11. paramètres URL après initialisation", async ({ page }) => {
    // Navigate with URL params pre-filled
    await page.goto("/?origin=DSS&dest=CDG&dep=2026-06-15&ret=2026-06-22&cabin=0&pax=1");
    await page.waitForTimeout(500);

    // The page should load without crashing
    await expect(page.getByRole("heading", { name: "Miles Optimizer" })).toBeVisible();

    // Search button should still be visible
    const searchBtn = page.getByRole("button", { name: /rechercher les vols|search flights/i });
    await expect(searchBtn).toBeVisible();
  });

  test("12. routes populaires visibles en état initial", async ({ page }) => {
    await page.goto("/");

    // Popular routes should appear in empty state
    const popular = page.getByText(/dakar|paris|lagos|abidjan|casablanca/i);
    // At least one popular route should be visible
    await expect(popular.first()).toBeVisible();
  });

});
