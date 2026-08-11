import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import log from "electron-log/main.js";

// Initialize electron-log
log.initialize();

// Send console logs to Terminal and DevTools
Object.assign(console, log.functions);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ==============================
// Create Window
// ==============================

function createWindow() {

  const win = new BrowserWindow({

    width: 1200,
    height: 800,

    webPreferences: {

      preload: path.join(
        __dirname,
        "preload.js"
      ),

    },

  });

  win.loadURL(
    "http://localhost:5173"
  );

  // Open DevTools
  win.webContents.openDevTools();

}


// ==============================
// App Ready
// ==============================

app.whenReady().then(createWindow);


// ==============================
// Chat + Document Handler
// ==============================

ipcMain.handle(
  "chat-message",
  async (event, data) => {

    console.log(
      "Message received:",
      data
    );

    try {

      const message =
        data.message;

      const documentContext =
        data.documentContext || "";


      let messages;


      // ==============================
      // Document is attached
      // ==============================

if (documentContext.trim()) {

    messages = [

        {
            role: "system",

            content: `
You are Luna.

Answer the user's question using the
provided document.

Do not invent information.

If the answer is present in the document,
answer directly.

If the answer is not present in the document,
say:

"I couldn't find that information in the document."
            `,
        },

        {
            role: "user",

            content: `
DOCUMENT:

${documentContext}

QUESTION:

${message}
            `,
        },

    ];

} else {

    messages = [

        {
            role: "user",

            content: message,
        },

    ];

}


      console.log(
        "Messages sent to Ollama:",
        messages
      );


      // ==============================
      // Send to Ollama
      // ==============================

      console.log(
        "Sending prompt to Ollama..."
      );


      const response = await axios.post(

        "http://localhost:11434/api/chat",

        {

          model: "qwen2.5:3b",

          messages: messages,

          stream: false,

        }

      );


      // ==============================
      // Ollama Response
      // ==============================

      console.log(
        "Ollama Response:",
        response.data
      );


      return response.data.message.content;


    } catch (error) {

      console.error(
        "OLLAMA ERROR:"
      );

      console.error(
        error.response?.data
      );

      console.error(
        error.message
      );


      return "Unable to connect to Ollama.";

    }

  }
);


// ==============================
// Close App
// ==============================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {

      app.quit();

    }

  }
);