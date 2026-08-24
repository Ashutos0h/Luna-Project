/* global process */

import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from "electron";

import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import log from "electron-log/main.js";
import { exec, execFile } from "child_process";


// ============================================================
// Electron Log
// ============================================================

log.initialize();

Object.assign(console, log.functions);


// ============================================================
// Paths
// ============================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


// ============================================================
// Create Window
// ============================================================

function createWindow() {

  const win = new BrowserWindow({

    width: 1200,

    height: 800,

    webPreferences: {

      preload:
        path.join(
          __dirname,
          "preload.js"
        ),

      contextIsolation: true,

      nodeIntegration: false,

    },

  });


  // ==========================================================
  // Window Focus
  // ==========================================================

  win.on("focus", () => {

    setTimeout(() => {

      if (
        !win.isDestroyed()
      ) {

        win.webContents.focus();

      }

    }, 50);

  });


  // ==========================================================
  // Window Show
  // ==========================================================

  win.on("show", () => {

    setTimeout(() => {

      if (
        !win.isDestroyed()
      ) {

        win.webContents.focus();

      }

    }, 50);

  });


  // ==========================================================
  // Load Application
  // ==========================================================

  if (app.isPackaged) {

    win.loadFile(
      path.join(
        __dirname,
        "../dist/index.html"
      )
    );

  } else {

    win.loadURL(
      "http://localhost:5173"
    );

  }


  // ==========================================================
  // Renderer Ready
  // ==========================================================

  win.webContents.on(
    "did-finish-load",
    () => {

      setTimeout(() => {

        if (
          !win.isDestroyed()
        ) {

          win.webContents.focus();

        }

      }, 100);

    }
  );

}


// ============================================================
// App Ready
// ============================================================

app.whenReady().then(() => {

  createWindow();


  app.on(
    "activate",
    () => {

      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {

        createWindow();

      }

    }
  );

});


// ============================================================
// Find Relevant Memories
// ============================================================

function getRelevantMemories(
  memories,
  message
) {

  if (
    !memories ||
    memories.length === 0
  ) {

    return [];

  }


  const questionWords =
    message
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2
      );


  const scoredMemories =
    memories.map(
      (memory) => {

        const memoryText = `
          ${memory.title}
          ${memory.value}
        `.toLowerCase();


        let score = 0;


        questionWords.forEach(
          (word) => {

            if (
              memoryText.includes(
                word
              )
            ) {

              score++;

            }

          }
        );


        return {
          memory,
          score,
        };

      }
    );


  return scoredMemories

    .filter(
      (item) =>
        item.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    )

    .slice(0, 5)

    .map(
      (item) =>
        item.memory
    );

}


// ============================================================
// Desktop Application Aliases & Protocols
// ============================================================

const appAliases = {
  calculator: "calc",
  calc: "calc",
  notepad: "notepad",
  "note pad": "notepad",
  paint: "mspaint",
  "microsoft paint": "mspaint",
  chrome: "chrome",
  "google chrome": "chrome",
  edge: "msedge",
  "microsoft edge": "msedge",
  explorer: "explorer",
  "file explorer": "explorer",
  files: "explorer",
  folder: "explorer",
  photos: "ms-photos:",
  gallery: "ms-photos:",
  word: "winword",
  "microsoft word": "winword",
  excel: "excel",
  "microsoft excel": "excel",
  powerpoint: "powerpnt",
  ppt: "powerpnt",
  vscode: "code",
  code: "code",
  "vs code": "code",
  "command prompt": "cmd",
  cmd: "cmd",
  terminal: "cmd",
  powershell: "powershell",
  taskmanager: "taskmgr",
  "task manager": "taskmgr",
  taskmgr: "taskmgr",
  settings: "ms-settings:",
  setting: "ms-settings:",
  camera: "microsoft.windows.camera:",
  store: "ms-windows-store:",
  "microsoft store": "ms-windows-store:",
  spotify: "spotify",
  vlc: "vlc",
  whatsapp: "whatsapp",
  discord: "discord",
  telegram: "telegram",
};


// ============================================================
// Open Desktop Application
// ============================================================

ipcMain.handle(
  "open-desktop-app",
  async (event, appName) => {

    try {

      const rawName =
        String(appName)
          .trim();

      const normalizedName =
        rawName.toLowerCase();


      if (!rawName) {

        return {

          success: false,

          message:
            "Application name is empty.",

        };

      }


      const targetCommand =
        appAliases[normalizedName] || rawName;


      console.log(
        `Launching desktop app: "${rawName}" -> command: "${targetCommand}"`
      );


      // Handle protocol URIs (e.g. ms-photos:, ms-settings:)
      if (
        targetCommand.includes(":") &&
        !targetCommand.includes("\\") &&
        !targetCommand.includes("/")
      ) {

        await shell.openExternal(
          targetCommand
        );


        return {

          success: true,

          message:
            `Opening ${rawName}.`,

        };

      }


      // Use Windows start command to launch any app by name/alias/path
      return new Promise((resolve) => {

        exec(
          `start "" "${targetCommand}"`,
          (error) => {

            if (error) {

              console.error(
                "Start command failed, attempting direct execFile:",
                error
              );


              execFile(
                targetCommand,
                (fileErr) => {

                  if (fileErr) {

                    console.error(
                      "Direct launch failed:",
                      fileErr
                    );


                    resolve({

                      success: false,

                      message:
                        `Could not open "${rawName}". Please check if the application is installed.`,

                    });

                  } else {

                    resolve({

                      success: true,

                      message:
                        `Opening ${rawName}.`,

                    });

                  }

                }

              );

            } else {

              resolve({

                success: true,

                message:
                  `Opening ${rawName}.`,

              });

            }

          }

        );

      });

    } catch (error) {

      console.error(
        "Desktop application error:",
        error
      );


      return {

        success: false,

        message:
          `I couldn't open ${appName}.`,

      };

    }

  }
);


// ============================================================
// Web Search
// ============================================================

ipcMain.handle(
  "search-web",
  async (event, query) => {

    try {

      const cleanQuery =
        String(query)
          .trim();


      if (!cleanQuery) {

        return {

          success: false,

          message:
            "Search query is empty.",

        };

      }


      const searchUrl =
        `https://www.google.com/search?q=${encodeURIComponent(
          cleanQuery
        )}`;


      await shell.openExternal(
        searchUrl
      );


      return {

        success: true,

        message:
          `Searching Google for "${cleanQuery}".`,

      };

    } catch (error) {

      console.error(
        "Web search error:",
        error
      );


      return {

        success: false,

        message:
          "I couldn't open the browser.",

      };

    }

  }
);


// ============================================================
// Chat + Document + Memory
// ============================================================

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


      const memories =
        data.memories || [];


      const relevantMemories =
        getRelevantMemories(
          memories,
          message
        );


      let memoryContext = "";


      if (
        relevantMemories.length > 0
      ) {

        memoryContext =
          relevantMemories

            .map(
              (memory) => {

                return `
Memory:
Title: ${memory.title}
Value: ${memory.value}
`;

              }
            )

            .join("\n");

      }


      let messages;


      // ========================================================
      // Document Mode
      // ========================================================

      if (
        documentContext.trim()
      ) {

        messages = [

          {

            role: "system",

            content: `
You are Luna, a helpful local AI assistant.

You have access to information saved by the user
as memories and to an attached document.

USER MEMORIES:

${memoryContext}

DOCUMENT RULES:

1. Use the attached document when the user's
question is about the document.

2. If the answer is present in the document,
answer directly.

3. Do not invent information from the document.

4. If the user asks about the document and the
answer is not present, say:

"I couldn't find that information in the document."

MEMORY RULES:

1. Use memories when they are relevant.

2. Do not invent memories.

3. If the user provides new information that
conflicts with an old memory, prefer the user's
current message.

Answer clearly and naturally.
`,

          },


          {

            role: "user",

            content: `
===== ATTACHED DOCUMENT =====

${documentContext}

===== END DOCUMENT =====

===== USER QUESTION =====

${message}

===== END QUESTION =====
`,

          },

        ];

      }


      // ========================================================
      // Normal Chat
      // ========================================================

      else {

        messages = [

          {

            role: "system",

            content: `
You are Luna, a helpful local AI assistant.

You have access to memories saved by the user.

USER MEMORIES:

${memoryContext}

MEMORY RULES:

1. Use memories when they are relevant.

2. Do not invent memories.

3. If the user provides new information that
conflicts with an old memory, prefer the user's
current message.

Answer clearly and naturally.
`,

          },


          {

            role: "user",

            content:
              message,

          },

        ];

      }


      const aiModel = data.aiModel || "qwen2.5:3b";

      // ========================================================
      // Ollama
      // ========================================================

      console.log(
        `Sending prompt to Ollama using model ${aiModel}...`
      );


      const response =
        await axios.post(

          "http://localhost:11434/api/chat",

          {

            model: aiModel,

            messages,

            stream: false,

          },

          {

            timeout: 45000,

          }

        );


      console.log(
        "Ollama Response:",
        response.data
      );


      return (
        response.data
          .message
          .content
      );


    } catch (error) {

      console.error(
        "OLLAMA ERROR:",
        error.response?.data || error.message
      );


      if (error.code === 'ECONNABORTED') {

        return "Request timed out. Please check if Ollama is running and responsive.";

      }


      return (
        "Unable to connect to Ollama. Please make sure Ollama is running and the model is downloaded."
      );

    }

  }
);


// ============================================================
// Close App
// ============================================================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();

    }

  }
);