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

      if (progress.model === settings.aiModel) {

        setModelDownload(progress);

      }

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


  function handleChange(e) {

    const {
      name,
      value,
    } = e.target;


    setSettings((prev) => {

      const updatedSettings = {

        ...prev,

        [name]: value,

      };


      // Theme changes are visual preferences, so apply them as soon as the
      // user picks an option instead of waiting for the Save button.
      if (
        name === "theme" &&
        onThemeChange
      ) {

        onThemeChange(value);

      }


      return updatedSettings;

    });


    if (name === "aiModel") void requestModelDownload(value);

  }


  async function requestModelDownload(model) {

    if (!window.electronAPI?.getOllamaModelInfo) return;


    const info = await window.electronAPI.getOllamaModelInfo(model);


    if (info.installed) {

      setModelDownload({
        model,
        state: "complete",
        status: `${model} is already downloaded.`,
        percent: 100,
      });

      return;

    }


    setModelDownload(null);
    setPendingModel(info);

  }


  async function confirmModelDownload() {

    if (!pendingModel) return;


    const model = pendingModel.model;

    setModelDownload({
      model,
      state: "starting",
      status: `Preparing ${model}...`,
      percent: 0,
    });
    setPendingModel(null);


    const result = await window.electronAPI.startOllamaModelDownload(
      model
    );


    if (!result.success) {

      setModelDownload({
        model,
        state: "error",
        status: result.message,
        retryable: true,
      });

    }

  }


  async function retryModelDownload() {

    const model = settings.aiModel;
    setModelDownload({
      model,
      state: "starting",
      status: `Preparing ${model}...`,
      percent: 0,
    });

    const result = await window.electronAPI.startOllamaModelDownload(model);
    if (!result.success) {
      setModelDownload({
        model,
        state: "error",
        status: result.message,
        retryable: true,
      });
    }

  }


  async function cancelModelDownload() {

    if (!modelDownload?.model) return;


    setModelDownload((current) => ({
      ...current,
      state: "cancelling",
      status: "Cancelling download...",
    }));


    await window.electronAPI.cancelOllamaModelDownload(
      modelDownload.model
    );

  }


  function showNotification(msg) {

    setNotification(msg);

    setTimeout(() => {

      setNotification("");

    }, 3000);

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
    const enabled = event.target.checked;
    setSettings((previous) => ({
      ...previous,
      desktopControlEnabled: enabled,
    }));
  }


  function handleSave() {
    if (!saveSettings(settings)) {
      showNotification("Settings could not be saved. Check available disk space.");
      return;
    }


    if (onSettingsSaved) {

      onSettingsSaved(settings);

    }


    showNotification(
      "Settings saved successfully!"
    );

  }


  function handleReset() {

    const defaults =
      getDefaultSettings();


    resetSettings();

    if (!saveSettings(defaults)) {
      showNotification("Settings could not be reset. Check available disk space.");
      return;
    }

    setSettings(defaults);


    if (onSettingsSaved) {

      onSettingsSaved(defaults);

    }


    if (onThemeChange) {

      onThemeChange(defaults.theme);

    }


    showNotification(
      "Settings reset successfully!"
    );

  }


  return (

    <div className="settings-container">

      <h1>Settings</h1>

      <p className="settings-intro">Manage your profile, appearance and local AI model.</p>


      {notification && (

        <div className="setting-toast">

          {notification}

        </div>

      )}


      {/* User Name */}

      <div className="setting-group">

        <label>
          User Name
        </label>

        <input

          type="text"

          name="userName"

          value={settings.userName}

          onChange={handleChange}

        />

      </div>


      {/* Assistant Name */}

      <div className="setting-group">

        <label>
          Assistant Name
        </label>

        <input

          type="text"

          name="assistantName"

          value={
            settings.assistantName
          }

          onChange={handleChange}

        />

      </div>


      {/* Language */}

      <div className="setting-group">

        <label>
          Language
        </label>

        <select

          name="language"

          value={settings.language}

          onChange={handleChange}

        >

          <option value="English">
            English
          </option>

          <option value="Hindi">
            Hindi
          </option>

        </select>

      </div>


      {/* Profession */}

      <div className="setting-group">

        <label>
          Profession
        </label>

        <select

          name="profession"

          value={settings.profession}

          onChange={handleChange}

        >

          <option value="Student">
            Student
          </option>

          <option value="Employee">
            Employee
          </option>

          <option value="Founder">
            Founder
          </option>

        </select>

      </div>


      {/* Theme */}

      <div className="setting-group">

        <label>
          Theme
        </label>

        <select

          name="theme"

          value={settings.theme}

          onChange={handleChange}

        >

          <option value="dark">
            Dark
          </option>

          <option value="light">
            Light
          </option>

        </select>

      </div>


      {/* AI Model */}

      <div className="setting-group">

        <label>
          AI Model
        </label>

        <select

          name="aiModel"

          value={settings.aiModel}

          onChange={handleChange}

        >

          <option value="qwen2.5:1.5b">
            Qwen 2.5 1.5B — Fastest on CPU
          </option>

          <option value="qwen2.5:3b">
            Qwen 2.5 3B — Balanced
          </option>

          <option value="llama3">
            Llama 3
          </option>

          <option value="mistral">
            Mistral
          </option>

          <option value="deepseek-r1:7b">
            DeepSeek R1 7B — Slower reasoning
          </option>

        </select>

        {pendingModel && (

          <div className="model-download-card">
            <p>
              {pendingModel.model} is not downloaded yet ({pendingModel.sizeLabel}).
              Download it now?
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

      </div>


      {/* Performance Mode */}

      <div className="setting-group">

        <label>
          Response Performance
        </label>

        <select

          name="performanceMode"

          value={settings.performanceMode || "fast"}

          onChange={handleChange}

        >

          <option value="fast">
            Fast — Best for desktop assistance
          </option>

          <option value="balanced">
            Balanced — More detail
          </option>

          <option value="quality">
            Quality — Longest, most thorough
          </option>

        </select>

        <p className="setting-field-help">
          Fast mode uses a smaller context and concise answers. Tool actions always use the quickest safe route.
        </p>

      </div>


      <div className="setting-group desktop-control-setting">

        <label>
          Advanced Desktop Control
        </label>

        <p className="setting-field-help">
          Lets Luna use UACC on this device for carefully scoped actions such as clicking a named on-screen control or typing exact text in the focused app. Every action still needs your confirmation.
        </p>

        <label className="desktop-control-toggle">
          <input
            type="checkbox"
            checked={settings.desktopControlEnabled === true}
            onChange={handleDesktopControlChange}
          />
          <span>Enable advanced desktop control for chat</span>
        </label>

        <div className="desktop-control-actions">
          <button type="button" onClick={checkDesktopControl} disabled={uaccStatus?.checking}>
            {uaccStatus?.checking ? "Checking…" : "Check availability"}
          </button>

          <button
            type="button"
            className="desktop-control-secondary"
            onClick={installDesktopControl}
            disabled={uaccInstall?.state === "starting" || uaccInstall?.state === "running"}
          >
            {uaccInstall?.state === "starting" || uaccInstall?.state === "running"
              ? "Setting up…"
              : "Install / repair"}
          </button>

          {uaccStatus?.connected && (
            <button type="button" className="desktop-control-secondary" onClick={inspectDesktop} disabled={uaccInspection?.checking}>
              {uaccInspection?.checking ? "Inspecting…" : "Inspect current window"}
            </button>
          )}
        </div>

        {uaccStatus?.message && (
          <p className={`desktop-control-status ${uaccStatus.connected ? "is-ready" : ""}`} role="status">
            {uaccStatus.message}
          </p>
        )}

        {uaccInspection?.message && (
          <p className={`desktop-control-status ${uaccInspection.success ? "is-ready" : ""}`} role="status">
            {uaccInspection.message}
          </p>
        )}

        {uaccInstall?.status && (
          <p className={`desktop-control-status ${uaccInstall.state === "complete" ? "is-ready" : ""}`} role="status">
            {uaccInstall.status}
          </p>
        )}

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
