/* global process */

import fs from "fs";
import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { isReadOnlyUaccTool, validateUaccInvocation } from "./uaccPolicy.js";

const CONNECT_TIMEOUT_MS = 15000;
const RESULT_TEXT_LIMIT = 16000;
let connection = null;
let connecting = null;
let lastConnectionError = "";

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function findUaccPython() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const candidates = [
    process.env.LUNA_UACC_PYTHON,
    path.join(localAppData, "Programs", "Python", "Python313", "python.exe"),
    path.join(localAppData, "Programs", "Python", "Python312", "python.exe"),
    path.join(localAppData, "Programs", "Python", "Python311", "python.exe"),
    path.join(localAppData, "Programs", "Python", "Python310", "python.exe"),
    path.join(programFiles, "Python313", "python.exe"),
    path.join(programFiles, "Python312", "python.exe"),
    path.join(programFiles, "Python311", "python.exe"),
    path.join(programFiles, "Python310", "python.exe"),
  ];

  return unique(candidates).find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  }) || null;
}

function cleanErrorMessage(raw, fallback) {
  if (!raw || typeof raw !== "string") return fallback;
  const str = raw.trim();
  // Strip Python tracebacks
  if (str.includes("Traceback (most recent call last):")) {
    const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const last = lines.at(-1);
    if (last) return last.replace(/^[A-Za-z0-9_.]+(?:Error|Exception):\s*/i, "").trim() || fallback;
  }
  // Strip JSON formatting if accidentally passed
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const obj = JSON.parse(str);
      const msg = obj.message || obj.error || obj.detail || obj.reason;
      if (msg && typeof msg === "string") return cleanErrorMessage(msg, fallback);
    } catch {
      // not json
    }
    return fallback;
  }
  return str.slice(0, 300);
}

function compactResult(result) {
  const text = (result?.content || [])
    .filter((item) => item?.type === "text")
    .map((item) => String(item.text || ""))
    .join("\n")
    .trim();

  // MCP transport success only says the tool call reached UACC. UACC tools
  // also return a structured success value inside their text payload, which
  // must be honoured so the UI never reports a failed search as completed.
  let structured = null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) structured = parsed;
  } catch {
    // Some read-only tools intentionally return plain human-readable text.
  }
  const reportedSuccess = typeof structured?.success === "boolean"
    ? structured.success
    : (typeof structured?.ok === "boolean"
      ? structured.ok
      : (["error", "failed", "failure"].includes(String(structured?.status || "").toLowerCase()) ? false : null));
  const isSuccess = !result?.isError && reportedSuccess !== false;

  const rawMsg = [structured?.message, structured?.error, structured?.detail, structured?.reason]
    .map((value) => typeof value === "string" ? value : "")
    .find((value) => value.trim());

  let userMessage;
  if (rawMsg) {
    userMessage = cleanErrorMessage(rawMsg, isSuccess ? "Desktop action completed." : "UACC could not complete the desktop action.");
  } else if (isSuccess) {
    userMessage = "Desktop action completed successfully.";
  } else {
    // Failure without a clear message: inspect text for common failure signals
    const lower = text.toLowerCase();
    if (lower.includes("not found") || lower.includes("element")) {
      userMessage = "Could not locate that element on screen. Make sure the window is visible.";
    } else if (lower.includes("window") || lower.includes("process")) {
      userMessage = "Could not find an open window for that application.";
    } else if (lower.includes("timeout") || lower.includes("timed out")) {
      userMessage = "The desktop action timed out. Please try again.";
    } else {
      userMessage = "UACC could not complete the desktop action.";
    }
  }

  return {
    success: isSuccess,
    text: text.slice(0, RESULT_TEXT_LIMIT),
    message: userMessage,
    truncated: text.length > RESULT_TEXT_LIMIT,
  };
}

async function createConnection() {
  const python = findUaccPython();
  if (!python) {
    throw new Error("Python 3.10 or newer is required before UACC can run.");
  }

  let stderr = "";
  const client = new Client({ name: "luna-desktop-control", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: python,
    args: ["-m", "uacc.mcp"],
    stderr: "pipe",
    env: { ...process.env, PYTHONUTF8: "1", UACC_FAILSAFE: "false" },
  });
  transport.stderr?.on("data", (chunk) => {
    stderr = `${stderr}${String(chunk || "")}`.slice(-2000);
  });

  try {
    await withTimeout(client.connect(transport), CONNECT_TIMEOUT_MS, "UACC took too long to start.");
    const toolList = await withTimeout(client.listTools(), CONNECT_TIMEOUT_MS, "UACC did not return its tool list.");
    const nextConnection = {
      client,
      transport,
      python,
      tools: toolList.tools || [],
      connectedAt: Date.now(),
    };
    transport.onclose = () => {
      if (connection === nextConnection) connection = null;
    };
    return nextConnection;
  } catch (error) {
    await transport.close().catch(() => {});
    const detail = stderr.trim().split(/\r?\n/).slice(-1)[0];
    throw new Error(detail ? `${error.message} (${detail})` : error.message, { cause: error });
  }
}

async function getConnection() {
  if (connection) return connection;
  if (!connecting) {
    connecting = createConnection()
      .then((nextConnection) => {
        connection = nextConnection;
        lastConnectionError = "";
        return connection;
      })
      .catch((error) => {
        lastConnectionError = error.message;
        throw error;
      })
      .finally(() => {
        connecting = null;
      });
  }
  return connecting;
}

export async function getUaccStatus({ connect = false } = {}) {
  const python = findUaccPython();
  if (!python) {
    return {
      available: false,
      connected: false,
      message: "Python 3.10 or newer is not installed. Install Python, then run: python -m pip install uacc",
      tools: [],
    };
  }

  if (connection) {
    return {
      available: true,
      connected: true,
      python,
      toolCount: connection.tools.length,
      tools: connection.tools.map((tool) => ({ name: tool.name, title: tool.title || tool.description || "" })),
      message: `UACC is ready with ${connection.tools.length} local desktop tools.`,
    };
  }

  if (!connect) {
    return {
      available: true,
      connected: false,
      python,
      tools: [],
      message: "UACC is installed but has not been started yet.",
    };
  }

  try {
    await getConnection();
    return getUaccStatus();
  } catch (error) {
    return {
      available: true,
      connected: false,
      python,
      tools: [],
      message: `UACC could not start: ${error.message}`,
    };
  }
}

export async function inspectDesktopWithUacc() {
  const activeWindow = await callUaccReadOnlyTool("get_active_window", {});
  const screen = await callUaccReadOnlyTool("get_screen_info", {
    include_labels: false,
    include_ocr: false,
  });

  return {
    success: activeWindow.success && screen.success,
    activeWindow: activeWindow.text,
    screen: screen.text,
    message: activeWindow.success && screen.success
      ? "Desktop inspection completed locally."
      : activeWindow.text || screen.text || "Desktop inspection could not be completed.",
  };
}

export async function callUaccReadOnlyTool(toolName, args = {}) {
  if (!isReadOnlyUaccTool(toolName)) {
    return { success: false, text: "That tool is not approved for read-only desktop inspection." };
  }
  try {
    const activeConnection = await getConnection();
    const result = await activeConnection.client.callTool({ name: toolName, arguments: args });
    return compactResult(result);
  } catch (error) {
    const raw = error.message || "";
    if (raw.includes("-32001") || raw.toLowerCase().includes("timed out")) {
      return { success: false, text: "Desktop inspection timed out. Please try again." };
    }
    return { success: false, text: `Desktop inspection failed: ${cleanErrorMessage(raw, "Could not inspect desktop.")}` };
  }
}

export async function callUaccControlTool(toolName, args = {}) {
  const validation = validateUaccInvocation(toolName, args);
  if (!validation.valid) return { success: false, message: validation.message };

  try {
    const activeConnection = await getConnection();
    const result = await activeConnection.client.callTool({
      name: validation.name,
      arguments: validation.arguments,
    });
    const compact = compactResult(result);
    return {
      success: compact.success,
      message: compact.message || (compact.success ? "Desktop action completed." : "UACC could not complete the desktop action."),
      truncated: compact.truncated,
    };
  } catch (error) {
    const raw = error.message || "";
    if (raw.includes("-32001") || raw.toLowerCase().includes("timed out")) {
      return { success: false, message: "Desktop action timed out. Make sure the application is open and visible, then try again." };
    }
    return { success: false, message: cleanErrorMessage(raw, "Desktop action could not be completed.") };
  }
}

export async function closeUaccConnection() {
  const current = connection;
  connection = null;
  if (current) await current.transport.close().catch(() => {});
}

export function getLastUaccConnectionError() {
  return lastConnectionError;
}
