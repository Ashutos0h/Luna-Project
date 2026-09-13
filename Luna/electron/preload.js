/* global require */

const {
  contextBridge,
  ipcRenderer,
} = require("electron");


contextBridge.exposeInMainWorld(
  "electronAPI",
  {

    // ========================================================
    // AI Chat
    // ========================================================

    sendMessage: (data) =>
      ipcRenderer.invoke(
        "chat-message",
        data
      ),

    cancelChatRequest: (requestId) =>
      ipcRenderer.invoke(
        "cancel-chat-request",
        requestId
      ),

    preloadOllamaModel: (modelName) =>
      ipcRenderer.invoke(
        "preload-ollama-model",
        modelName
      ),

    prepareAssistantModels: (options) =>
      ipcRenderer.invoke(
        "prepare-assistant-models",
        options
      ),

    onChatStream: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on("chat-stream", listener);
      return () => ipcRenderer.removeListener("chat-stream", listener);
    },

    copyText: (text) =>
      ipcRenderer.invoke(
        "copy-text",
        text
      ),


    // ========================================================
    // Open Desktop Application
    // ========================================================

    openApp: (appName) =>
      ipcRenderer.invoke(
        "open-desktop-app",
        appName
      ),

    openAppAndType: (application, text) =>
      ipcRenderer.invoke(
        "open-app-and-type",
        { application, text }
      ),

    openAppAndSearch: (application, query, engine = "google") =>
      ipcRenderer.invoke(
        "open-app-and-search",
        { application, query, engine }
      ),

    searchInApplication: (application, query, allowDesktopControl = false) =>
      ipcRenderer.invoke(
        "search-in-application",
        { application, query, allowDesktopControl }
      ),


    // ========================================================
    // Search Web
    // ========================================================

    searchWeb: (query, engine = "google") =>
      ipcRenderer.invoke(
        "search-web",
        { query, engine }
      ),

    openWebsite: (url) =>
      ipcRenderer.invoke(
        "open-website",
        url
      ),

    openCommonFolder: (location) =>
      ipcRenderer.invoke(
        "open-common-folder",
        location
      ),


    // ========================================================
    // Advanced desktop control (UACC MCP)
    // ========================================================

    getUaccStatus: () =>
      ipcRenderer.invoke("get-uacc-status"),

    inspectDesktop: () =>
      ipcRenderer.invoke("inspect-uacc-desktop"),

    installUacc: () =>
      ipcRenderer.invoke("install-uacc"),

    onUaccInstallProgress: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on("uacc-install-progress", listener);
      return () => ipcRenderer.removeListener("uacc-install-progress", listener);
    },

    runDesktopControl: (toolName, args) =>
      ipcRenderer.invoke("run-uacc-control", {
        toolName,
        arguments: args,
      }),


    // ========================================================
    // Ollama Auto Detection & Installer
    // ========================================================

    checkOllamaStatus: () =>
      ipcRenderer.invoke(
        "check-ollama-status"
      ),

    downloadAndRunOllama: () =>
      ipcRenderer.invoke(
        "download-and-run-ollama"
      ),

    downloadOllamaModel: (modelName) =>
      ipcRenderer.invoke(
        "download-ollama-model",
        modelName
      ),

    getOllamaModelInfo: (modelName) =>
      ipcRenderer.invoke("get-ollama-model-info", modelName),

    getOllamaModelDownloadStatus: (modelName) =>
      ipcRenderer.invoke("get-ollama-model-download-status", modelName),

    startOllamaModelDownload: (modelName) =>
      ipcRenderer.invoke("start-ollama-model-download", modelName),

    cancelOllamaModelDownload: (modelName) =>
      ipcRenderer.invoke("cancel-ollama-model-download", modelName),

    onOllamaModelProgress: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on("ollama-model-progress", listener);
      return () => ipcRenderer.removeListener("ollama-model-progress", listener);
    },

    onOllamaProgress: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on("ollama-progress", listener);
      return () => {
        ipcRenderer.removeListener("ollama-progress", listener);
      };
    },

  }
);
