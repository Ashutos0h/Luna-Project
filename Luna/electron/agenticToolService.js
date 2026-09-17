// ============================================================
// Luna Agentic Tool Service
// Streamlined tool definitions and local execution dispatcher
// ============================================================

import { performWebSearch, formatSearchResultsForContext } from "./webSearchService.js";

export function getAgenticTools({ desktopControlEnabled = false, allowAutoMemory = true } = {}) {
  const tools = [
    {
      type: "function",
      function: {
        name: "web_search",
        description:
          "Search the live web for verified facts, public officials, prime ministers, presidents, historical timelines, complete lists, dates, current events, weather, and real-time data. Call this tool whenever the user asks for historical lists, public figures, dates, current events, or factual rankings so you do not hallucinate.",
        parameters: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "The specific search query to look up on the web.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "open_media",
        description:
          "Open Spotify, YouTube, Netflix, or a media player to play or search for a song, artist, album, playlist, video, or movie.",
        parameters: {
          type: "object",
          required: ["platform", "query"],
          properties: {
            platform: {
              type: "string",
              enum: ["spotify", "youtube", "netflix", "music"],
              description: "The media platform to open (spotify, youtube, netflix, or music).",
            },
            query: {
              type: "string",
              description: "The title of the song, artist, video, or content to play or search for.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "open_application",
        description:
          "Launch an installed desktop application on Windows (e.g. Notepad, Calculator, VS Code, Paint, Chrome, Terminal) and optionally type text into it.",
        parameters: {
          type: "object",
          required: ["application"],
          properties: {
            application: {
              type: "string",
              description: "The name of the desktop application to launch (e.g. 'Notepad', 'Calculator', 'Chrome').",
            },
            text: {
              type: "string",
              description: "Optional text to type or paste into the application once opened.",
            },
          },
        },
      },
    },
  ];

  if (desktopControlEnabled) {
    tools.push({
      type: "function",
      function: {
        name: "desktop_control",
        description:
          "Perform advanced screen control via UACC: click an on-screen button/element, press a keyboard shortcut, scroll, or switch between windows.",
        parameters: {
          type: "object",
          required: ["action"],
          properties: {
            action: {
              type: "string",
              enum: ["click_element", "hotkey", "scroll", "focus_window", "type_text"],
              description: "The desktop action to perform.",
            },
            target: {
              type: "string",
              description: "Label of the element to click, window title to focus, or text to type.",
            },
            keys: {
              type: "array",
              items: { type: "string" },
              description: "Keys for hotkey action, e.g. ['ctrl', 's'], ['enter'], ['f5'], ['escape'].",
            },
            direction: {
              type: "string",
              enum: ["up", "down"],
              description: "Direction to scroll ('up' or 'down').",
            },
          },
        },
      },
    });
  }

  if (allowAutoMemory) {
    tools.push({
      type: "function",
      function: {
        name: "save_memory",
        description: "Save a stable personal fact, favorite, or user preference to persistent local memory.",
        parameters: {
          type: "object",
          required: ["title", "value"],
          properties: {
            title: {
              type: "string",
              description: "Short category or title for the memory (e.g. 'Favorite Music', 'User Name', 'Preference').",
            },
            value: {
              type: "string",
              description: "The stable personal fact to remember.",
            },
          },
        },
      },
    });
  }

  return tools;
}

export async function executeAgenticToolCall(call, context = {}) {
  const name = String(call?.function?.name || "").trim();
  let args;
  try {
    args = typeof call?.function?.arguments === "string"
      ? JSON.parse(call.function.arguments)
      : (call?.function?.arguments || {});
  } catch {
    args = {};
  }

  const {
    openDesktopApplication,
    pasteTextIntoApplication,
    executeBackgroundShellCommand,
    shell,
    dialog,
    mainWindow,
    callUaccControlTool,
    parentWindow,
  } = context;

  // 1. Web Search
  if (name === "web_search") {
    const query = String(args.query || "").trim();
    if (!query) {
      return { success: false, message: "Search query is empty." };
    }
    const searchResult = await performWebSearch(query);
    return {
      success: searchResult.success,
      query,
      results: searchResult.results,
      formattedText: formatSearchResultsForContext(searchResult),
      message: searchResult.message,
    };
  }

  // 2. Open Media (Spotify, YouTube, Netflix, etc.)
  if (name === "open_media") {
    const platform = String(args.platform || "spotify").toLowerCase().trim();
    const query = String(args.query || "").trim();

    if (platform === "spotify") {
      const uri = query ? `spotify:search:${encodeURIComponent(query)}` : "spotify:";
      await shell.openExternal(uri);
      return {
        success: true,
        message: query
          ? `Opened Spotify and searched for "${query}".`
          : "Opened Spotify.",
      };
    }

    if (platform === "youtube") {
      const url = query
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        : "https://www.youtube.com";
      await shell.openExternal(url);
      return {
        success: true,
        message: query
          ? `Opened YouTube and searched for "${query}".`
          : "Opened YouTube.",
      };
    }

    if (platform === "netflix") {
      const url = query
        ? `https://www.netflix.com/search?q=${encodeURIComponent(query)}`
        : "https://www.netflix.com";
      await shell.openExternal(url);
      return {
        success: true,
        message: query
          ? `Opened Netflix and searched for "${query}".`
          : "Opened Netflix.",
      };
    }

    // Default media search
    await shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(`${platform} ${query}`)}`);
    return { success: true, message: `Opened ${platform} for "${query}".` };
  }

  // 3. Open Application (with optional typing)
  if (name === "open_application") {
    const application = String(args.application || "").trim();
    const textToType = String(args.text || "").trim();

    if (!application) {
      return { success: false, message: "Application name is required." };
    }

    const isShellApp = /^(?:powershell|cmd|terminal|command prompt|bash)$/i.test(application);

    // If typing text or running a command in a shell/terminal, process it silently in the background!
    if (isShellApp && textToType && typeof executeBackgroundShellCommand === "function") {
      return executeBackgroundShellCommand(application, textToType);
    }

    // If typing text is requested for GUI apps, require user confirmation
    if (textToType) {
      const win = parentWindow || mainWindow;
      const preview = textToType.length > 240 ? `${textToType.slice(0, 240)}…` : textToType;
      const confirmation = await dialog.showMessageBox(win, {
        type: "question",
        buttons: ["Cancel", "Open and type"],
        defaultId: 1,
        cancelId: 0,
        noLink: true,
        title: "Confirm desktop typing",
        message: `Open ${application} and type this text?`,
        detail: preview,
      });

      if (confirmation.response !== 1) {
        return { success: false, cancelled: true, message: "Typing was cancelled by user." };
      }

      const launchResult = await openDesktopApplication(application);
      if (!launchResult.success) return launchResult;

      try {
        await pasteTextIntoApplication(launchResult.activationTarget || application, textToType);
        return { success: true, message: `Opened ${application} and typed the requested text.` };
      } catch (err) {
        return { success: false, message: `${application} opened, but could not paste text: ${err.message}` };
      }
    }

    // Just opening the app
    return openDesktopApplication(application);
  }

  // 4. Desktop Control (UACC)
  if (name === "desktop_control") {
    if (!callUaccControlTool) {
      return { success: false, message: "UACC desktop control is not available." };
    }

    const action = String(args.action || "").toLowerCase().trim();
    const target = String(args.target || "").trim();

    if (action === "click_element") {
      return callUaccControlTool("click_element", {
        name: target,
        reasoning: "User asked to click this on-screen element.",
      });
    }

    if (action === "hotkey") {
      const keys = Array.isArray(args.keys) ? args.keys.map(String) : [target];
      return callUaccControlTool("hotkey", {
        keys,
        reasoning: "User asked to press this keyboard shortcut.",
      });
    }

    if (action === "scroll") {
      return callUaccControlTool("scroll", {
        direction: args.direction || "down",
        amount: 5,
        reasoning: "User asked to scroll.",
      });
    }

    if (action === "focus_window") {
      return callUaccControlTool("focus_window", {
        title: target,
        reasoning: "User asked to focus this window.",
      });
    }

    if (action === "type_text") {
      return callUaccControlTool("type_text", {
        text: target,
        reasoning: "User asked to type text in active application.",
      });
    }

    return { success: false, message: `Unknown desktop control action: ${action}` };
  }

  // 5. Save Memory
  if (name === "save_memory") {
    return {
      success: true,
      savedMemory: {
        title: String(args.title || "User Detail").trim().slice(0, 100),
        value: String(args.value || "").trim().slice(0, 1000),
      },
      message: "Saved to memory.",
    };
  }

  return { success: false, message: `Unknown tool: ${name}` };
}
