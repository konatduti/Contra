export type AppLanguage = "en" | "hu";

export type LegalDocsState = {
  huTerms: string;
  huPrivacy: string;
  enTerms: string;
  enPrivacy: string;
};

export type LegalBannerSettings = {
  termsUpdated: boolean;
  privacyUpdated: boolean;
};

export const LEGAL_DRAFT_KEY = "contra:legal_docs:draft:v1";
export const LEGAL_PUBLISHED_KEY = "contra:legal_docs:published:v1";
export const LEGAL_BANNER_SETTINGS_KEY = "contra:legal_docs:banner:v1";
export const LEGAL_BANNER_UPDATED_EVENT = "contra:legal_banner_settings_updated";

export const defaultLegalDocs: LegalDocsState = {
  huTerms: "Hungarian terms and conditions...",
  huPrivacy: "Hungarian privacy policy...",
  enTerms: "English terms and conditions...",
  enPrivacy: "English privacy policy..."
};

export const defaultLegalBannerSettings: LegalBannerSettings = {
  termsUpdated: false,
  privacyUpdated: false
};

const mergeDocs = (stored: Partial<LegalDocsState>): LegalDocsState => ({
  ...defaultLegalDocs,
  ...stored
});

const mergeBannerSettings = (stored: Partial<LegalBannerSettings>): LegalBannerSettings => ({
  ...defaultLegalBannerSettings,
  ...stored
});

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
  }
};

export const loadDraftLegalDocs = (): LegalDocsState =>
  mergeDocs(readStorage<Partial<LegalDocsState>>(LEGAL_DRAFT_KEY, defaultLegalDocs));

export const saveDraftLegalDocs = (docs: LegalDocsState) => {
  writeStorage(LEGAL_DRAFT_KEY, docs);
};

export const loadPublishedLegalDocs = (): LegalDocsState =>
  mergeDocs(readStorage<Partial<LegalDocsState>>(LEGAL_PUBLISHED_KEY, defaultLegalDocs));

export const savePublishedLegalDocs = (docs: LegalDocsState) => {
  writeStorage(LEGAL_PUBLISHED_KEY, docs);
};

export const loadLegalBannerSettings = (): LegalBannerSettings =>
  mergeBannerSettings(
    readStorage<Partial<LegalBannerSettings>>(LEGAL_BANNER_SETTINGS_KEY, defaultLegalBannerSettings)
  );

export const saveLegalBannerSettings = (settings: LegalBannerSettings) => {
  writeStorage(LEGAL_BANNER_SETTINGS_KEY, settings);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEGAL_BANNER_UPDATED_EVENT));
  }
};

export const getTermsByLanguage = (docs: LegalDocsState, language: AppLanguage) =>
  language === "hu" ? docs.huTerms : docs.enTerms;

export const getPrivacyByLanguage = (docs: LegalDocsState, language: AppLanguage) =>
  language === "hu" ? docs.huPrivacy : docs.enPrivacy;
