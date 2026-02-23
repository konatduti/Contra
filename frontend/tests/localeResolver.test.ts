import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, resolveLanguagePreference } from "@/lib/locale/resolve";

describe("resolveLanguagePreference", () => {
  it("prefers the database value when available", () => {
    expect(
      resolveLanguagePreference({
        dbLanguage: "hu",
        cookieLanguage: "en",
        headerLanguages: ["en-US"]
      })
    ).toBe("hu");
  });

  it("falls back to cookie when database is empty", () => {
    expect(
      resolveLanguagePreference({
        dbLanguage: null,
        cookieLanguage: "hu",
        headerLanguages: ["en-US"]
      })
    ).toBe("hu");
  });

  it("derives language from Accept-Language header", () => {
    expect(
      resolveLanguagePreference({
        dbLanguage: undefined,
        cookieLanguage: "fr",
        headerLanguages: ["fr-FR", "hu-HU", "en"]
      })
    ).toBe("hu");
  });

  it("uses English as the final fallback", () => {
    expect(
      resolveLanguagePreference({
        dbLanguage: undefined,
        cookieLanguage: undefined,
        headerLanguages: ["de-DE", "sk"]
      })
    ).toBe("en");
  });
});

describe("parseAcceptLanguage", () => {
  it("splits values and removes weights", () => {
    expect(parseAcceptLanguage("en-US,en;q=0.9,hu-HU;q=0.7")).toEqual(["en-US", "en", "hu-HU"]);
  });

  it("ignores wildcards and empty values", () => {
    expect(parseAcceptLanguage("*, , es-ES;q=0.5")).toEqual(["es-ES"]);
  });
});
