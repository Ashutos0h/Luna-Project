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
  const reportedMessage = [structured?.message, structured?.error, structured?.detail, structured?.reason]
    .map((value) => typeof value === "string" ? value : "")
    .find((value) => value.trim());

  return {
    success: !result?.isError && reportedSuccess !== false,
    text: text.slice(0, RESULT_TEXT_LIMIT),
    message: reportedMessage || text.slice(0, RESULT_TEXT_LIMIT),
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
    env: { ...process.env, PYTHONUTF8: "1" },
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
    return { success: false, text: `UACC inspection failed: ${error.message}` };
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
    return { success: false, message: `UACC action failed: ${error.message}` };
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
