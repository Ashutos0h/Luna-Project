import { useEffect, useState } from "react";
import "../styles/Setting.css"
import {
  loadSettings,
  saveSettings,
  resetSettings,
  getDefaultSettings,
} from "../services/settingsStorage";

function Setting({ onSettingsSaved }) {
  const [settings, setSettings] = useState(getDefaultSettings());

  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSave() {
saveSettings(settings);

if (onSettingsSaved) {

    onSettingsSaved(settings);

}

alert("Settings saved successfully!");
  }

  function handleReset() {
    resetSettings();

    const defaults = getDefaultSettings();

saveSettings(defaults);


if (onSettingsSaved) {

    onSettingsSaved(defaults);

}

alert("Settings reset successfully!");
  }
  return (
    <div className="settings-container">

      <h1>Settings</h1>

      {/* User Name */}
      <div className="setting-group">
        <label>User Name</label>

        <input
          type="text"
          name="userName"
          value={settings.userName}
          onChange={handleChange}
        />
      </div>

      {/* Assistant Name */}
      <div className="setting-group">
        <label>Assistant Name</label>

        <input
          type="text"
          name="assistantName"
          value={settings.assistantName}
          onChange={handleChange}
        />
      </div>

      {/* Language */}
      <div className="setting-group">
        <label>Language</label>

        <select
          name="language"
          value={settings.language}
          onChange={handleChange}
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
        </select>
      </div>

      {/* Theme */}
      <div className="setting-group">
        <label>Theme</label>

        <select
          name="theme"
          value={settings.theme}
          onChange={handleChange}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* AI Model */}
      <div className="setting-group">
        <label>AI Model</label>

        <select
          name="aiModel"
          value={settings.aiModel}
          onChange={handleChange}
        >
          <option value="qwen2.5:3b">Qwen 2.5 3B</option>
          <option value="llama3">Llama 3</option>
          <option value="mistral">Mistral</option>
          <option value="deepseek-r1:7b">DeepSeek R1 7B</option>
        </select>
      </div>

      <div className="button-group">

        <button
          className="save-btn"
          onClick={handleSave}
        >
          Save Settings
        </button>

        <button
          className="reset-btn"
          onClick={handleReset}
        >
          Reset Settings
        </button>

      </div>

    </div>
  );
}

export default Setting;