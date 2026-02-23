export type UserSettings = {
  theme: "system" | "light" | "dark";
  language: "en" | "hu";
  reduceMotion: boolean;
  compactMode: boolean;
  workspace: {
    analysisDepth: "fast" | "standard" | "thorough";
    autoRunAnalysis: boolean;
    showClauseConfidence: boolean;
    reportFormat: "pdf" | "docx";
    riskThreshold: "low" | "medium" | "high";
  };
  documents: {
    redactSensitiveExports: boolean;
    autoDeleteAfter: "7d" | "30d" | "never";
  };
  notifications: {
    highRisk: boolean;
    weekly: boolean;
    updates: boolean;
    analysisComplete: boolean;
    creditLowEnabled: boolean;
    creditLowThreshold: number;
  };
  privacy: {
    sessionTimeout: "15m" | "30m" | "60m" | "never";
  };
  security: {
    twoFactorEnabled: boolean;
  };
};

export const USER_SETTINGS_KEY = "contra:user_settings:v1";

export const defaultUserSettings: UserSettings = {
  theme: "system",
  language: "en",
  reduceMotion: false,
  compactMode: false,
  workspace: {
    analysisDepth: "standard",
    autoRunAnalysis: true,
    showClauseConfidence: true,
    reportFormat: "pdf",
    riskThreshold: "medium"
  },
  documents: {
    redactSensitiveExports: true,
    autoDeleteAfter: "30d"
  },
  notifications: {
    highRisk: true,
    weekly: true,
    updates: false,
    analysisComplete: true,
    creditLowEnabled: true,
    creditLowThreshold: 200
  },
  privacy: {
    sessionTimeout: "30m"
  },
  security: {
    twoFactorEnabled: false
  }
};

const normalizeStoredSettings = (
  stored: Partial<UserSettings> & {
    privacy?: { piiSanitiser?: boolean };
    documents?: { redactSensitiveExports?: boolean };
  }
): Partial<UserSettings> => {
  const legacySanitiser = stored.privacy?.piiSanitiser;
  const redactSensitiveExports =
    stored.documents?.redactSensitiveExports ??
    legacySanitiser ??
    defaultUserSettings.documents.redactSensitiveExports;
  const autoDeleteAfter =
    stored.documents?.autoDeleteAfter ?? defaultUserSettings.documents.autoDeleteAfter;

  return {
    ...stored,
    documents: {
      ...defaultUserSettings.documents,
      ...stored.documents,
      redactSensitiveExports,
      autoDeleteAfter
    }
  };
};

const mergeUserSettings = (stored: Partial<UserSettings>): UserSettings => {
  const normalized = normalizeStoredSettings(stored);
  return {
    ...defaultUserSettings,
    ...normalized,
    workspace: {
      ...defaultUserSettings.workspace,
      ...normalized.workspace
    },
    documents: {
      ...defaultUserSettings.documents,
      ...normalized.documents
    },
    notifications: {
      ...defaultUserSettings.notifications,
      ...normalized.notifications
    },
    privacy: {
      ...defaultUserSettings.privacy,
      ...normalized.privacy
    },
    security: {
      ...defaultUserSettings.security,
      ...normalized.security
    }
  };
};

export const loadUserSettings = (): UserSettings => {
  if (typeof window === "undefined") {
    return defaultUserSettings;
  }

  try {
    const raw = window.localStorage.getItem(USER_SETTINGS_KEY);
    if (!raw) {
      return defaultUserSettings;
    }

    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return mergeUserSettings(parsed ?? {});
  } catch (error) {
    console.error("Failed to load user settings", error);
    return defaultUserSettings;
  }
};

export const saveUserSettings = (settings: UserSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save user settings", error);
  }
};
