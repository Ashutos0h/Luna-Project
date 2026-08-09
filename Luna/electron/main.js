import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

ipcMain.handle("chat-message", async (event, message) => {
  console.log("Message received:", message);

  try {
    console.log("Calling Ollama...");

const response = await axios.post(
  "http://localhost:11434/api/chat",
  {
    model: message.model,

    messages: [
      {
        role: "user",
        content: message.prompt,
      },
    ],

    stream: false,
  }
);

    console.log("Ollama Response:", response.data);

    return response.data.message.content;
  } catch (error) {
    console.log("ERROR:");
    console.log(error.response?.data);
    console.log(error.message);

    return "Unable to connect to Ollama";
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});