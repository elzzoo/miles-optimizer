import { PROGRAMS } from "../../src/data/programs.js";

describe("PROGRAMS booking URLs", () => {
  test("all programs have a bookingUrl", () => {
    for (const p of PROGRAMS) {
      expect(p.bookingUrl, `${p.id} missing bookingUrl`).toBeTruthy();
    }
  });

  test("all bookingUrls are valid https:// URLs", () => {
    for (const p of PROGRAMS) {
      expect(p.bookingUrl, `${p.id} bookingUrl must start with https://`).toMatch(/^https:\/\//);
    }
  });

  test("previously-broken URLs are corrected", () => {
    const byId = Object.fromEntries(PROGRAMS.map(p => [p.id, p]));

    // Emirates Skywards — old 404
    expect(byId.skywards.bookingUrl).toBe("https://www.emirates.com/english/skywards/spend-miles/");

    // Kenya Airways Asante — old 404
    expect(byId.asante.bookingUrl).toBe("https://asante.kenya-airways.com/");

    // Royal Air Maroc Safar — old 404
    expect(byId.safar.bookingUrl).toBe("https://www.royalairmaroc.com/us-en/loyalty");

    // Tunisair Fidelys — old 404
    expect(byId.fidelys.bookingUrl).toBe("https://fidelys.tunisair.com/en");
  });

  test("dead URLs are absent", () => {
    const deadUrls = [
      "https://www.emirates.com/english/skywards/redeeming-miles/",
      "https://www.kenya-airways.com/en/flying-with-us/asante-miles/",
      "https://www.royalairmaroc.com/safarflyer",
      "https://www.tunisair.com/fidelys",
    ];
    for (const p of PROGRAMS) {
      expect(deadUrls, `${p.id} still uses a dead URL`).not.toContain(p.bookingUrl);
    }
  });
});
