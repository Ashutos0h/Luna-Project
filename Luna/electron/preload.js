const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (message) =>
    ipcRenderer.invoke("chat-message", message),
});