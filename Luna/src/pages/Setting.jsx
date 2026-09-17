import { useEffect, useState } from "react";

import "../styles/Setting.css";
import ModelDownloadStatus from "../components/ModelDownloadStatus";

import {
  loadSettings,
  saveSettings,
  resetSettings,
  getDefaultSettings,
} from "../services/settingsStorage";


function Setting({ onSettingsSaved, onThemeChange }) {

  const [settings, setSettings] =
    useState(() => loadSettings());

  const [notification, setNotification] =
    useState("");

  const [modelDownload, setModelDownload] =
    useState(null);

  const [pendingModel, setPendingModel] =
    useState(null);

  const [uaccStatus, setUaccStatus] =
    useState(null);

  const [uaccInspection, setUaccInspection] =
    useState(null);

  const [uaccInstall, setUaccInstall] =
    useState(null);


  useEffect(() => {

    if (!window.electronAPI?.onOllamaModelProgress) return undefined;

    const unsubscribe = window.electronAPI.onOllamaModelProgress((progress) => {
      if (progress.model === settings.aiModel) setModelDownload(progress);
    });

    window.electronAPI.getOllamaModelDownloadStatus?.(settings.aiModel).then((progress) => {
      if (progress) setModelDownload(progress);
    });

    return unsubscribe;

  }, [settings.aiModel]);


  useEffect(() => {
    if (!window.electronAPI?.onUaccInstallProgress) return undefined;
    return window.electronAPI.onUaccInstallProgress((progress) => {
      setUaccInstall(progress);
    });
  }, []);

  useEffect(() => {
    if (settings.desktopControlEnabled && window.electronAPI?.getUaccStatus) {
      void checkDesktopControl();
    }
  }, [settings.desktopControlEnabled]);


  function handleChange(e) {
    const { name, value } = e.target;
    setSettings((prev) => {
      const updatedSettings = { ...prev, [name]: value };
      if (name === "theme" && onThemeChange) onThemeChange(value);
      return updatedSettings;
    });
    if (name === "aiModel") void requestModelDownload(value);
  }


  async function requestModelDownload(model) {
    if (!window.electronAPI?.getOllamaModelInfo) return;
    const info = await window.electronAPI.getOllamaModelInfo(model);
    if (info.installed) {
      setModelDownload({ model, state: "complete", status: `${model} is already downloaded.`, percent: 100 });
      return;
    }
    setModelDownload(null);
    setPendingModel(info);
  }


  async function confirmModelDownload() {
    if (!pendingModel) return;
    const model = pendingModel.model;
    setModelDownload({ model, state: "starting", status: `Preparing ${model}...`, percent: 0 });
    setPendingModel(null);
    const result = await window.electronAPI.startOllamaModelDownload(model);
    if (!result.success) setModelDownload({ model, state: "error", status: result.message, retryable: true });
  }


  async function retryModelDownload() {
    const model = settings.aiModel;
    setModelDownload({ model, state: "starting", status: `Preparing ${model}...`, percent: 0 });
    const result = await window.electronAPI.startOllamaModelDownload(model);
    if (!result.success) setModelDownload({ model, state: "error", status: result.message, retryable: true });
  }


  async function cancelModelDownload() {
    if (!modelDownload?.model) return;
    setModelDownload((current) => ({ ...current, state: "cancelling", status: "Cancelling download..." }));
    await window.electronAPI.cancelOllamaModelDownload(modelDownload.model);
  }


  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  }


  async function checkDesktopControl() {
    if (!window.electronAPI?.getUaccStatus) {
      setUaccStatus({ connected: false, message: "Advanced desktop control is available only in the Luna desktop application." });
      return;
    }
    setUaccStatus({ checking: true, message: "Starting local desktop control…" });
    setUaccInspection(null);
    try {
      const status = await window.electronAPI.getUaccStatus();
      setUaccStatus(status);
    } catch {
      setUaccStatus({ connected: false, message: "Luna could not check advanced desktop control." });
    }
  }


  async function inspectDesktop() {
    if (!window.electronAPI?.inspectDesktop) return;
    setUaccInspection({ checking: true, message: "Inspecting the current window locally…" });
    try {
      const result = await window.electronAPI.inspectDesktop();
      setUaccInspection(result);
    } catch {
      setUaccInspection({ success: false, message: "Luna could not inspect the current window." });
    }
  }


  async function installDesktopControl() {
    if (!window.electronAPI?.installUacc) {
      setUaccInstall({ state: "error", status: "Advanced desktop control is available only in the Luna desktop application." });
      return;
    }
    setUaccInstall({ state: "starting", status: "Waiting for your confirmation…" });
    setUaccInspection(null);
    try {
      const result = await window.electronAPI.installUacc();
      setUaccInstall({
        state: result?.success ? "complete" : (result?.cancelled ? "cancelled" : "error"),
        status: result?.message || "Advanced desktop control setup did not complete.",
      });
      if (result?.success) {
        const status = await window.electronAPI.getUaccStatus?.();
        if (status) setUaccStatus(status);
      }
    } catch {
      setUaccInstall({ state: "error", status: "Luna could not set up advanced desktop control." });
    }
  }


  function handleDesktopControlChange(event) {
    const nextValue = event.target.checked;
    setSettings((previous) => {
      const updated = { ...previous, desktopControlEnabled: nextValue };
      saveSettings(updated);
      if (onSettingsSaved) onSettingsSaved(updated);
      return updated;
    });
  }


  function handleSave() {
    if (!saveSettings(settings)) {
      showNotification("Settings could not be saved. Check available disk space.");
      return;
    }
    if (onSettingsSaved) onSettingsSaved(settings);
    showNotification("Settings saved successfully!");
  }


  function handleReset() {
    const defaults = getDefaultSettings();
    resetSettings();
    if (!saveSettings(defaults)) {
      showNotification("Settings could not be reset. Check available disk space.");
      return;
    }
    setSettings(defaults);
    if (onSettingsSaved) onSettingsSaved(defaults);
    if (onThemeChange) onThemeChange(defaults.theme);
    showNotification("Settings reset to defaults.");
  }


  return (

    <div className="settings-container">

      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-intro">Manage your profile, appearance and local AI model.</p>
      </div>


      {notification && (
        <div className="setting-toast">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {notification}
        </div>
      )}


      {/* ── Profile ── */}
      <div className="settings-section">
        <div className="settings-section-title">Profile</div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Your Name</span>
            <span className="setting-row-desc">How Luna will address you in conversations.</span>
          </div>
          <div className="setting-row-control">
            <input
              className="setting-input"
              type="text"
              name="userName"
              value={settings.userName}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Assistant Name</span>
            <span className="setting-row-desc">Customize the name of your AI assistant.</span>
          </div>
          <div className="setting-row-control">
            <input
              className="setting-input"
              type="text"
              name="assistantName"
              value={settings.assistantName}
              onChange={handleChange}
              placeholder="e.g. Luna"
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Profession</span>
            <span className="setting-row-desc">Helps Luna tailor responses to your role.</span>
          </div>
          <div className="setting-row-control">
            <select className="setting-select" name="profession" value={settings.profession} onChange={handleChange}>
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Founder">Founder</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Language</span>
            <span className="setting-row-desc">Preferred language for responses.</span>
          </div>
          <div className="setting-row-control">
            <select className="setting-select" name="language" value={settings.language} onChange={handleChange}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>
      </div>


      {/* ── Appearance ── */}
      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Theme</span>
            <span className="setting-row-desc">Choose between dark and light mode.</span>
          </div>
          <div className="setting-row-control">
            <select className="setting-select" name="theme" value={settings.theme} onChange={handleChange}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>


      {/* ── AI Model ── */}
      <div className="settings-section">
        <div className="settings-section-title">AI Model</div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Model</span>
            <span className="setting-row-desc">Local model powered by Ollama. Larger models are slower but more capable.</span>
          </div>
          <div className="setting-row-control">
            <select className="setting-select" name="aiModel" value={settings.aiModel} onChange={handleChange}>
              <option value="qwen2.5:1.5b">Qwen 2.5 1.5B — Fastest</option>
              <option value="qwen2.5:3b">Qwen 2.5 3B — Balanced</option>
              <option value="llama3">Llama 3</option>
              <option value="mistral">Mistral</option>
              <option value="deepseek-r1:7b">DeepSeek R1 7B — Reasoning</option>
            </select>
          </div>
        </div>

        {pendingModel && (
          <div className="model-download-card">
            <p>
              <strong>{pendingModel.model}</strong> is not downloaded yet ({pendingModel.sizeLabel}).
              Would you like to download it now?
            </p>
            <div className="model-download-actions">
              <button type="button" onClick={confirmModelDownload}>Download</button>
              <button type="button" onClick={() => setPendingModel(null)}>Not now</button>
            </div>
          </div>
        )}

        <ModelDownloadStatus
          download={modelDownload}
          onCancel={cancelModelDownload}
          onRetry={retryModelDownload}
        />

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Response Performance</span>
            <span className="setting-row-desc">Fast mode uses concise answers. Quality mode produces longer, more thorough responses.</span>
          </div>
          <div className="setting-row-control">
            <select className="setting-select" name="performanceMode" value={settings.performanceMode || "fast"} onChange={handleChange}>
              <option value="fast">Fast</option>
              <option value="balanced">Balanced</option>
              <option value="quality">Quality</option>
            </select>
          </div>
        </div>
      </div>


      {/* ── Desktop Control ── */}
      <div className="settings-section">
        <div className="settings-section-title">Desktop Control</div>

        <div className="setting-row">
          <div className="setting-row-left">
            <span className="setting-row-label">Advanced Desktop Control</span>
            <span className="setting-row-desc">
              Lets Luna use UACC for scoped actions like clicking a named on-screen control or typing text in the focused app. Every action requires your confirmation.
            </span>
          </div>
          <div className="setting-row-control">
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.desktopControlEnabled === true}
                onChange={handleDesktopControlChange}
              />
              <span className="setting-toggle-track" />
            </label>
          </div>
        </div>

        <div className="desktop-control-actions">
          <button
            type="button"
            className={`dc-btn dc-btn-primary`}
            onClick={checkDesktopControl}
            disabled={uaccStatus?.checking}
          >
            {uaccStatus?.checking ? "Checking…" : "Check availability"}
          </button>

          <button
            type="button"
            className="dc-btn"
            onClick={installDesktopControl}
            disabled={uaccInstall?.state === "starting" || uaccInstall?.state === "running"}
          >
            {uaccInstall?.state === "starting" || uaccInstall?.state === "running" ? "Setting up…" : "Install / repair"}
          </button>

          {uaccStatus?.connected && (
            <button
              type="button"
              className="dc-btn"
              onClick={inspectDesktop}
              disabled={uaccInspection?.checking}
            >
              {uaccInspection?.checking ? "Inspecting…" : "Inspect current window"}
            </button>
          )}
        </div>

        {uaccStatus?.message && (
          <p className={`dc-status ${uaccStatus.connected ? "is-ready" : ""}`} role="status">
            {uaccStatus.message}
          </p>
        )}

        {uaccInspection?.message && (
          <p className={`dc-status ${uaccInspection.success ? "is-ready" : ""}`} role="status">
            {uaccInspection.message}
          </p>
        )}

        {uaccInstall?.status && (
          <p className={`dc-status ${uaccInstall.state === "complete" ? "is-ready" : ""}`} role="status">
            {uaccInstall.status}
          </p>
        )}
      </div>


      {/* ── Actions ── */}
      <div className="settings-actions">
        <button className="btn-reset" onClick={handleReset}>
          Reset to defaults
        </button>
        <button className="btn-save" onClick={handleSave}>
          Save changes
        </button>
      </div>

    </div>

  );

}


export default Setting;
