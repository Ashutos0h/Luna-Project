const SETTINGS_KEY = "luna_settings";

// Default Settings
const defaultSettings = {
  userName: "User",
  assistantName: "Luna",
  language: "English",
  profession: "Student",
  theme: "dark",
  aiModel: "qwen2.5:3b",
};

// Load Settings
export function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(savedSettings);

    return {
      ...defaultSettings,
      ...parsedSettings,
    };

  } catch (error) {

    console.error("Error loading settings:", error);

    return defaultSettings;

  }
}

// Save Settings
export function saveSettings(settings) {

  const updatedSettings = {

    ...defaultSettings,

    ...settings,

  };

  localStorage.setItem(

    SETTINGS_KEY,

    JSON.stringify(updatedSettings)

  );

}

// Reset Settings
export function resetSettings() {

  localStorage.removeItem(SETTINGS_KEY);

}

// Get Default Settings
export function getDefaultSettings() {

  return {

    ...defaultSettings,

  };

}