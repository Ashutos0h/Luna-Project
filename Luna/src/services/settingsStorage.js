const SETTINGS_KEY = "luna_settings";

// Default Settings
const defaultSettings = {
    userName: "User",
    assistantName: "Luna",
    language: "English",
    theme: "dark",
    aiModel: "qwen2.5:3b",
};

// Load Settings
export function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (!savedSettings) {
    return defaultSettings;
  }

  return JSON.parse(savedSettings);
}

// Save Settings
export function saveSettings(settings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

// Reset Settings
export function resetSettings() {
  localStorage.removeItem(SETTINGS_KEY);
}

// Get Default Settings
export function getDefaultSettings() {
  return defaultSettings;
}