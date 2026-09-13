const SETTINGS_KEY = "luna_settings";

// Default Settings
const defaultSettings = {
  userName: "User",
  assistantName: "Luna",
  language: "English",
  profession: "Student",
  theme: "dark",
  aiModel: "qwen2.5:3b",
  autoMemory: true,
  performanceMode: "fast",
  desktopControlEnabled: false,
};

export function normalizeSettings(value) {
  const settings = value && typeof value === "object" ? value : {};
  const language = ["English", "Hindi"].includes(settings.language) ? settings.language : defaultSettings.language;
  const profession = ["Student", "Employee", "Founder"].includes(settings.profession) ? settings.profession : defaultSettings.profession;
  const theme = ["dark", "light"].includes(settings.theme) ? settings.theme : defaultSettings.theme;
  const performanceMode = ["fast", "balanced", "quality"].includes(settings.performanceMode)
    ? settings.performanceMode
    : defaultSettings.performanceMode;
  const requestedModel = String(settings.aiModel || defaultSettings.aiModel).trim();

  return {
    userName: String(settings.userName || defaultSettings.userName).trim().slice(0, 80) || defaultSettings.userName,
    assistantName: String(settings.assistantName || defaultSettings.assistantName).trim().slice(0, 80) || defaultSettings.assistantName,
    language,
    profession,
    theme,
    aiModel: /^[a-z0-9][a-z0-9_.:-]*$/i.test(requestedModel) ? requestedModel : defaultSettings.aiModel,
    autoMemory: settings.autoMemory !== false,
    performanceMode,
    desktopControlEnabled: settings.desktopControlEnabled === true,
  };
}

// Load Settings
export function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (!savedSettings) {
    return { ...defaultSettings };
  }

  try {
    const parsedSettings = JSON.parse(savedSettings);

    return normalizeSettings(parsedSettings);

  } catch (error) {

    console.error("Error loading settings:", error);

    return defaultSettings;

  }
}

// A saved name pair confirms that the user finished the initial setup. Keeping
// this separate from `loadSettings` avoids treating default settings as signup.
export function hasCompletedSetup() {

  try {

    const savedSettings =
      JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "null"
      );


    return Boolean(
      savedSettings?.userName?.trim() &&
      savedSettings?.assistantName?.trim()
    );

  } catch (error) {

    console.error("Error checking setup status:", error);

    return false;

  }

}

// Save Settings
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
    return true;
  } catch (error) {
    console.error("Unable to save settings:", error);
    return false;
  }

}

// Reset Settings
export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error("Unable to reset settings:", error);
    return false;
  }

}

// Get Default Settings
export function getDefaultSettings() {

  return {

    ...defaultSettings,

  };

}
