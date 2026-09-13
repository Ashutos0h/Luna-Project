import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Setup.css";
import { saveSettings } from "../services/settingsStorage";
import ModelDownloadStatus from "../components/ModelDownloadStatus";

const INTENT_ROUTER_MODEL = "qwen2.5:3b";

function Setup() {
  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [language, setLanguage] = useState("English");
  const [profession, setProfession] = useState("Student");
  const [theme, setTheme] = useState("Dark");
  const [aiModel, setAiModel] = useState("qwen2.5:3b");
  const [error, setError] = useState("");
  const [modelDownload, setModelDownload] = useState(null);
  const [pendingModel, setPendingModel] = useState(null);

  const [ollamaStatus, setOllamaStatus] = useState({
    checked: false,
    installed: false,
    running: false,
    models: [],
    message: "",
  });

  const [downloadProgress, setDownloadProgress] = useState({
    installing: false,
    percent: 0,
    status: "",
  });

  const navigate = useNavigate();
  const modelDownloadActive = ["starting", "downloading", "retrying", "cancelling"]
    .includes(modelDownload?.state);

  // Apply theme to document body in real-time as user changes theme dropdown
  useEffect(() => {
    const activeTheme = (theme || "Dark").toLowerCase();
    document.body.setAttribute("data-theme", activeTheme);
  }, [theme]);

  useEffect(() => {
    if (!window.electronAPI?.onOllamaModelProgress) return undefined;

    const unsubscribe = window.electronAPI.onOllamaModelProgress((progress) => {
      if (progress.model === aiModel || progress.model === INTENT_ROUTER_MODEL) {
        setModelDownload(progress);
      }
    });

    window.electronAPI.getOllamaModelDownloadStatus?.(aiModel).then((progress) => {
      if (progress) setModelDownload(progress);
    });

    return unsubscribe;
  }, [aiModel]);

  // Runs Ollama check and updates state from result (called outside useEffect)
  const checkOllama = useCallback(() => {
    const fetchStatus = async () => {
      if (window.electronAPI?.checkOllamaStatus) {
        try {
          const res = await window.electronAPI.checkOllamaStatus();
          return {
            checked: true,
            installed: res.installed,
            running: res.running,
            models: res.models || [],
            message: res.message || "",
          };
        } catch (err) {
          console.error("Error checking Ollama status:", err);
          return {
            checked: true,
            installed: false,
            running: false,
            models: [],
            message: "Could not check Ollama status.",
          };
        }
      }
      return {
        checked: true,
        installed: true,
        running: true,
        models: ["qwen2.5:3b"],
        message: "Web Dev Mode",
      };
    };
    return fetchStatus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkOllama().then((result) => {
      if (!cancelled) setOllamaStatus(result);
    });
    return () => { cancelled = true; };
  }, [checkOllama]);

  async function handleDownloadOllama() {
    if (!window.electronAPI?.downloadAndRunOllama) return;

    setDownloadProgress({ installing: true, percent: 5, status: "Starting download..." });

    const unsubscribe = window.electronAPI.onOllamaProgress((data) => {
      setDownloadProgress({
        installing: true,
        percent: data.percent || 10,
        status: data.status || "Processing...",
      });
    });

    try {
      const res = await window.electronAPI.downloadAndRunOllama();
      if (res.success) {
        setDownloadProgress({ installing: false, percent: 100, status: "Installation Complete!" });
        checkOllama().then((result) => setOllamaStatus(result));
      } else {
        setError(res.message || "Failed to install Ollama.");
        setDownloadProgress({ installing: false, percent: 0, status: "" });
      }
    } catch (err) {
      setError(`Installation error: ${err.message}`);
      setDownloadProgress({ installing: false, percent: 0, status: "" });
    } finally {
      if (unsubscribe) unsubscribe();
    }
  }

  async function requestModelDownload(model) {
    if (!window.electronAPI?.getOllamaModelInfo) return true;

    const info = await window.electronAPI.getOllamaModelInfo(model);
    if (info.installed) {
      setModelDownload({ model, state: "complete", status: `${model} is already downloaded.`, percent: 100 });
      return true;
    }

    setModelDownload(null);
    setPendingModel(info);
    return false;
  }

  function handleModelChange(event) {
    const model = event.target.value;
    setAiModel(model);
    void requestModelDownload(model);
  }

  async function confirmModelDownload() {
    if (!pendingModel) return;

    const model = pendingModel.model;
    setModelDownload({ model, state: "starting", status: `Preparing ${model}...`, percent: 0 });
    setPendingModel(null);
    const result = await window.electronAPI.startOllamaModelDownload(model);
    if (!result.success) {
      setModelDownload({ model, state: "error", status: result.message, retryable: true });
    }
  }

  async function retryModelDownload() {
    const model = modelDownload?.model || aiModel;
    setModelDownload({ model, state: "starting", status: `Preparing ${model}...`, percent: 0 });
    const result = await window.electronAPI.startOllamaModelDownload(model);
    if (!result.success) {
      setModelDownload({ model, state: "error", status: result.message, retryable: true });
    }
  }

  async function cancelModelDownload() {
    if (!modelDownload?.model) return;
    setModelDownload((current) => ({ ...current, state: "cancelling", status: "Cancelling download..." }));
    await window.electronAPI.cancelOllamaModelDownload(modelDownload.model);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!assistantName.trim()) {
      setError("Please enter assistant name.");
      return;
    }

    if (!language) {
      setError("Please select a language.");
      return;
    }

    if (!profession) {
      setError("Please select a profession.");
      return;
    }

    if (!theme) {
      setError("Please select a theme.");
      return;
    }

    const modelReady = await requestModelDownload(aiModel);
    if (!modelReady) {
      setError("Please choose whether to download the selected AI model.");
      return;
    }

    const intentRouterReady = await requestModelDownload(INTENT_ROUTER_MODEL);
    if (!intentRouterReady) {
      setError("Luna needs the Qwen 2.5 3B core model to understand search, application and memory intents.");
      return;
    }

    saveSettings({
      userName,
      assistantName,
      language,
      profession,
      theme: theme.toLowerCase(),
      aiModel,
    });

    navigate("/dashboard");
  }

  return (
    <div className="setup-container">
      <div className="setup-shell">
        <aside className="setup-intro">
          <div className="setup-brand"><span>L</span> Luna</div>
          <div className="setup-intro-copy">
            <span className="setup-eyebrow">Private AI for your desktop</span>
            <h2>Your assistant.<br />Your computer.<br /><em>Your data.</em></h2>
            <p>Luna runs locally with Ollama, so your conversations remain on this device.</p>
          </div>
          <div className="setup-benefits">
            <div><span>✓</span><p><strong>Local by default</strong><small>No cloud account required</small></p></div>
            <div><span>✓</span><p><strong>Built for your workflow</strong><small>Chat, documents and desktop actions</small></p></div>
            <div><span>✓</span><p><strong>You stay in control</strong><small>Memories and history are removable</small></p></div>
          </div>
          <div className="setup-private-badge"><i /> Data stays on this device</div>
        </aside>
      <div className="setup-card">
        <span className="setup-step">Step 1 of 1</span>
        <h1>Make Luna yours</h1>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: "15px", textAlign: "center", fontWeight: "600" }}>
            {error}
          </div>
        )}

        <p className="setup-subtitle">A few details help Luna respond in a way that fits you.</p>

        {/* Ollama Engine Detection Card */}
        {ollamaStatus.checked && (
          <div className="ollama-status-card">
            <div className="ollama-status-header">
              <span>Ollama Engine</span>
              {ollamaStatus.running ? (
                <span className="ollama-badge ready">Ready</span>
              ) : ollamaStatus.installed ? (
                <span className="ollama-badge warning">Starting...</span>
              ) : (
                <span className="ollama-badge error">Not Installed</span>
              )}
            </div>

            {!ollamaStatus.installed && !downloadProgress.installing && (
              <button
                type="button"
                className="ollama-install-btn"
                onClick={handleDownloadOllama}
              >
                Download &amp; Install Ollama Automatically
              </button>
            )}

            {downloadProgress.installing && (
              <div>
                <div style={{ fontSize: "13px", color: "var(--secondary-text)", marginBottom: "4px" }}>
                  {downloadProgress.status} ({downloadProgress.percent}%)
                </div>
                <div className="ollama-progress-bar">
                  <div
                    className="ollama-progress-fill"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <form className="setup-form" onSubmit={handleSubmit}>

          <div className="setup-field">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="setup-field">
            <label>Assistant Name</label>
            <input
              type="text"
              placeholder="e.g. Luna"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
            />
          </div>

          <div className="setup-field">
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className="setup-field">
            <label>Profession</label>
            <select value={profession} onChange={(e) => setProfession(e.target.value)}>
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Founder">Founder</option>
            </select>
          </div>

          <div className="setup-field">
            <label>Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="Dark">Dark</option>
              <option value="Light">Light</option>
            </select>
          </div>

          <div className="setup-field">
            <label>AI Model</label>
            <select value={aiModel} onChange={handleModelChange}>
              <option value="qwen2.5:1.5b">Qwen 2.5 1.5B — Fastest on CPU</option>
              <option value="qwen2.5:3b">Qwen 2.5 3B — Balanced</option>
              <option value="llama3">Llama 3</option>
              <option value="mistral">Mistral</option>
              <option value="deepseek-r1:7b">DeepSeek R1 7B — Slower reasoning</option>
            </select>
            {pendingModel && (
              <div className="model-download-card">
                <p>{pendingModel.model} is not downloaded yet ({pendingModel.sizeLabel}). Download it now?</p>
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

          <button type="submit" className="setup-submit-btn" disabled={modelDownloadActive}>
            {modelDownloadActive ? "Downloading model…" : "Continue →"}
          </button>

          <p className="setup-consent">You can change these preferences anytime in Settings.</p>

        </form>
      </div>
      </div>
    </div>
  );
}

export default Setup;
