const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

    sendMessage: (data) =>
        ipcRenderer.invoke(
            "chat-message",
            data
        ),

});