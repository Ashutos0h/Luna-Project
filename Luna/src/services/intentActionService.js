import { addMemory } from "./memoryStorage";

function createActionResult(type, success, message, extra = {}) {
  return { type, success, message, ...extra };
}

export async function executeIntentActions(actions, onProgress, { desktopControlEnabled = false } = {}) {
  if (!Array.isArray(actions) || actions.length === 0) return [];

  const results = [];

  for (const action of actions.slice(0, 3)) {
    try {
      onProgress?.(action);
      if (action.type === "search_web") {
        if (!window.electronAPI?.searchWeb) {
          results.push(createActionResult(action.type, false, "Browser search is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.searchWeb(action.query, action.engine);
        results.push(createActionResult(action.type, Boolean(result?.success), result?.message || "The browser search could not be opened."));
        continue;
      }

      if (action.type === "open_app") {
        if (!window.electronAPI?.openApp) {
          results.push(createActionResult(action.type, false, "Application launching is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.openApp(action.application);
        results.push(createActionResult(action.type, Boolean(result?.success), result?.message || "The application could not be opened."));
        continue;
      }

      if (action.type === "open_app_and_type") {
        if (!window.electronAPI?.openAppAndType) {
          results.push(createActionResult(action.type, false, "Desktop typing is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.openAppAndType(action.application, action.text);
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "The application could not be opened for typing.",
          { cancelled: Boolean(result?.cancelled) }
        ));
        continue;
      }

      if (action.type === "generate_and_type") {
        if (!window.electronAPI?.openAppAndType) {
          results.push(createActionResult(action.type, false, "Generated writing can be pasted only in the Luna desktop application."));
          continue;
        }

        const text = String(action.text || "").trim();
        if (!text) {
          results.push(createActionResult(action.type, false, "Luna could not generate text to paste into the application."));
          continue;
        }
        if (text.length > 4000) {
          results.push(createActionResult(action.type, false, "The generated text is too long to paste safely. Ask Luna to make it shorter, then try again."));
          continue;
        }

        const result = await window.electronAPI.openAppAndType(action.application, text);
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "The generated content could not be pasted into the application.",
          { cancelled: Boolean(result?.cancelled), generatedContent: text }
        ));
        continue;
      }

      if (action.type === "open_app_and_search") {
        if (!window.electronAPI?.openAppAndSearch) {
          results.push(createActionResult(action.type, false, "Browser search is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.openAppAndSearch(action.application, action.query, action.engine);
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "The browser search could not be opened.",
          { cancelled: Boolean(result?.cancelled) }
        ));
        continue;
      }

      if (action.type === "search_in_application") {
        if (!window.electronAPI?.searchInApplication) {
          results.push(createActionResult(action.type, false, "Application search is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.searchInApplication(
          action.application,
          action.query,
          desktopControlEnabled
        );
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "The application search could not be completed.",
          { cancelled: Boolean(result?.cancelled) }
        ));
        continue;
      }

      if (action.type === "open_url") {
        if (!window.electronAPI?.openWebsite) {
          results.push(createActionResult(action.type, false, "Opening websites is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.openWebsite(action.url);
        results.push(createActionResult(action.type, Boolean(result?.success), result?.message || "The website could not be opened."));
        continue;
      }

      if (action.type === "open_folder") {
        if (!window.electronAPI?.openCommonFolder) {
          results.push(createActionResult(action.type, false, "Opening folders is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.openCommonFolder(action.location);
        results.push(createActionResult(action.type, Boolean(result?.success), result?.message || "The folder could not be opened."));
        continue;
      }

      if (action.type === "uacc_click_element") {
        if (!window.electronAPI?.runDesktopControl) {
          results.push(createActionResult(action.type, false, "Advanced desktop control is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.runDesktopControl("click_element", {
          name: action.element,
          element_type: action.elementType || undefined,
          reasoning: "The user explicitly asked Luna to click this element.",
        });
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "Luna could not click that desktop element.",
          { cancelled: Boolean(result?.cancelled) }
        ));
        continue;
      }

      if (action.type === "uacc_type_text") {
        if (!window.electronAPI?.runDesktopControl) {
          results.push(createActionResult(action.type, false, "Advanced desktop control is available only in the Luna desktop application."));
          continue;
        }

        const result = await window.electronAPI.runDesktopControl("type_text", {
          text: action.text,
          human_like: false,
          reasoning: "The user explicitly asked Luna to type this exact text.",
        });
        results.push(createActionResult(
          action.type,
          Boolean(result?.success),
          result?.message || "Luna could not type in the focused desktop application.",
          { cancelled: Boolean(result?.cancelled) }
        ));
        continue;
      }

      if (action.type === "save_memory") {
        const saved = addMemory({
          id: `memory-${window.crypto.randomUUID()}`,
          title: action.title,
          value: action.value,
          source: "assistant",
          createdAt: Date.now(),
        });

        results.push(createActionResult(
          action.type,
          saved,
          saved ? "Saved to Memory." : "That detail could not be saved to Memory."
        ));
      }
    } catch (error) {
      console.error(`Intent action failed (${action.type}):`, error);
      results.push(createActionResult(action.type, false, "Luna could not complete that action."));
    }
  }

  return results;
}
