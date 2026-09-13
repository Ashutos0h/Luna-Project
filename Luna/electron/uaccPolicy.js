/* global Buffer */

const MAX_TEXT_LENGTH = 4000;
const MAX_ARGUMENT_BYTES = 12000;

export const UACC_READ_ONLY_TOOLS = new Set([
  "get_active_window",
  "get_screen_info",
  "get_screen_info_enhanced",
  "list_monitors",
  "list_windows",
  "find_element",
  "get_mouse_position",
  "get_system_info",
  "get_action_history",
]);

export const UACC_CONTROL_TOOLS = new Set([
  "launch_app",
  "open_url",
  "focus_window",
  "minimize_maximize",
  "resize_window",
  "move_window",
  "click",
  "click_element",
  "smart_click",
  "type_text",
  "smart_type",
  "hotkey",
  "scroll",
  "drag",
  "hover",
]);

const SENSITIVE_CONTENT = /\b(?:password|passcode|pin|one[- ]time password|otp|api[- ]?key|access[- ]?token|secret|credit card|debit card|cvv|bank account|social security|ssn)\b/i;
const SAFE_APP_NAME = /^[a-z0-9][a-z0-9 ._()&+-]{0,119}$/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasSafePayloadSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_ARGUMENT_BYTES;
  } catch {
    return false;
  }
}

function isIntegerInRange(value, minimum = -1, maximum = 20000) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function validateUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateUaccInvocation(toolName, rawArguments) {
  const name = String(toolName || "").trim();
  const args = isPlainObject(rawArguments) ? rawArguments : null;

  if (!UACC_CONTROL_TOOLS.has(name)) {
    return { valid: false, message: "That desktop action is not available through Luna." };
  }
  if (!args || !hasSafePayloadSize(args)) {
    return { valid: false, message: "The desktop action has invalid or oversized input." };
  }

  if (["type_text", "smart_type"].includes(name)) {
    const text = String(args.text || "");
    if (!text.trim() || text.length > MAX_TEXT_LENGTH) {
      return { valid: false, message: "Text to type must contain up to 4,000 characters." };
    }
    if (SENSITIVE_CONTENT.test(text)) {
      return { valid: false, message: "Luna will not automate typing sensitive credentials." };
    }
  }

  if (name === "launch_app") {
    if (!SAFE_APP_NAME.test(String(args.app || "")) || String(args.arguments || "").length > 500) {
      return { valid: false, message: "The application request is not safe to run." };
    }
  }

  if (name === "open_url" && !validateUrl(args.url)) {
    return { valid: false, message: "Only secure web URLs can be opened through desktop control." };
  }

  if (name === "click_element") {
    if (!String(args.name || "").trim() || String(args.name).length > 160) {
      return { valid: false, message: "A short visible element name is required before Luna can click it." };
    }
    if (args.element_type && String(args.element_type).length > 60) {
      return { valid: false, message: "The element type is not valid." };
    }
  }

  if (["focus_window", "minimize_maximize", "resize_window", "move_window"].includes(name)) {
    if (!String(args.title || "").trim() || String(args.title).length > 200) {
      return { valid: false, message: "A valid application window title is required." };
    }
  }

  if (["click", "hover", "scroll"].includes(name)) {
    if (!isIntegerInRange(args.x) || !isIntegerInRange(args.y)) {
      return { valid: false, message: "The screen coordinates are outside Luna's safe range." };
    }
  }

  if (name === "drag") {
    const coordinates = [args.start_x, args.start_y, args.end_x, args.end_y];
    if (!coordinates.every((coordinate) => isIntegerInRange(coordinate))) {
      return { valid: false, message: "The drag coordinates are outside Luna's safe range." };
    }
  }

  if (name === "hotkey") {
    const keys = args.keys;
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > 4 || keys.some((key) => !/^[a-z0-9]+$/i.test(String(key)))) {
      return { valid: false, message: "The keyboard shortcut is not valid." };
    }
  }

  return { valid: true, name, arguments: args };
}

export function isReadOnlyUaccTool(toolName) {
  return UACC_READ_ONLY_TOOLS.has(String(toolName || "").trim());
}

export function summarizeUaccAction(toolName, args) {
  const name = String(toolName || "");
  if (name === "launch_app") return `Open ${args.app}`;
  if (name === "open_url") return `Open ${args.url}`;
  if (["type_text", "smart_type"].includes(name)) return `Type ${String(args.text || "").slice(0, 80)}`;
  if (name === "hotkey") return `Press ${args.keys.join(" + ")}`;
  if (["focus_window", "minimize_maximize", "resize_window", "move_window"].includes(name)) return `${name.replace(/_/g, " ")} for ${args.title}`;
  return name.replace(/_/g, " ");
}
