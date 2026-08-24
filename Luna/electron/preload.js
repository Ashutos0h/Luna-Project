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


    // ========================================================
    // Open Desktop Application
    // ========================================================

    openApp: (appName) =>
      ipcRenderer.invoke(
        "open-desktop-app",
        appName
      ),


    // ========================================================
    // Search Web
    // ========================================================

    searchWeb: (query) =>
      ipcRenderer.invoke(
        "search-web",
        query
      ),

  }
);