import assert from "node:assert/strict";
import test from "node:test";

import {
  getAgenticTools,
  executeAgenticToolCall,
} from "../electron/agenticToolService.js";
import {
  cleanHtmlText,
  extractStructuredTablesFromHtml,
  formatSearchResultsForContext,
  performWebSearch,
} from "../electron/webSearchService.js";

test("getAgenticTools defines clean, consolidated tools", () => {
  const baseTools = getAgenticTools({ desktopControlEnabled: false, allowAutoMemory: false });
  const baseNames = baseTools.map((t) => t.function.name);
  assert.deepEqual(baseNames, ["web_search", "open_media", "open_application"]);

  const allTools = getAgenticTools({ desktopControlEnabled: true, allowAutoMemory: true });
  const allNames = allTools.map((t) => t.function.name);
  assert.deepEqual(allNames, ["web_search", "open_media", "open_application", "desktop_control", "save_memory"]);

  const searchTool = allTools.find((t) => t.function.name === "web_search");
  assert.equal(searchTool.function.parameters.required.includes("query"), true);

  const mediaTool = allTools.find((t) => t.function.name === "open_media");
  assert.equal(mediaTool.function.parameters.required.includes("platform"), true);
  assert.equal(mediaTool.function.parameters.required.includes("query"), true);
});

test("performWebSearch safely handles empty and malformed queries", async () => {
  const emptyRes = await performWebSearch("");
  assert.equal(emptyRes.success, false);
  assert.deepEqual(emptyRes.results, []);

  const nullRes = await performWebSearch(null);
  assert.equal(nullRes.success, false);
  assert.deepEqual(nullRes.results, []);
});

test("formatSearchResultsForContext formats snippets cleanly", () => {
  const empty = formatSearchResultsForContext({ success: false, results: [] });
  assert.equal(empty, "No web results found.");

  const sample = {
    success: true,
    results: [
      { title: "Mumbai Weather", snippet: "Currently 30°C and partly cloudy.", url: "https://weather.com" },
    ],
  };
  const formatted = formatSearchResultsForContext(sample);
  assert.match(formatted, /Mumbai Weather/);
  assert.match(formatted, /30°C/);
});

test("executeAgenticToolCall handles open_media protocols", async () => {
  const openedUrls = [];
  const fakeContext = {
    shell: {
      openExternal: async (url) => { openedUrls.push(url); },
    },
  };

  const spotifyCall = {
    function: {
      name: "open_media",
      arguments: JSON.stringify({ platform: "spotify", query: "kabira" }),
    },
  };
  const res = await executeAgenticToolCall(spotifyCall, fakeContext);
  assert.equal(res.success, true);
  assert.equal(openedUrls[0], "spotify:search:kabira");

  const ytCall = {
    function: {
      name: "open_media",
      arguments: JSON.stringify({ platform: "youtube", query: "bbs" }),
    },
  };
  const ytRes = await executeAgenticToolCall(ytCall, fakeContext);
  assert.equal(ytRes.success, true);
  assert.match(openedUrls[1], /youtube\.com\/results\?search_query=bbs/);
});

test("executeAgenticToolCall handles save_memory", async () => {
  const memoryCall = {
    function: {
      name: "save_memory",
      arguments: JSON.stringify({ title: "Favorite Band", value: "Coldplay" }),
    },
  };
  const res = await executeAgenticToolCall(memoryCall, {});
  assert.equal(res.success, true);
  assert.equal(res.savedMemory.title, "Favorite Band");
  assert.equal(res.savedMemory.value, "Coldplay");
});

test("cleanHtmlText strips data attributes, styles, references, and JSON debris", () => {
  const dirty = `
    <span data-mw='{"parts":[{"template":{"target":{"wt":"legend"}}}]}'>
      <sup class="reference">[1]</sup>
      <style>.foo { color: red; }</style>
      <b>Jawaharlal Nehru</b>&nbsp;(1889–1964)
      #00BFFF"}}]}'>
    </span>
  `;
  const cleaned = cleanHtmlText(dirty);
  assert.equal(cleaned.includes("data-mw"), false);
  assert.equal(cleaned.includes("[1]"), false);
  assert.equal(cleaned.includes(".foo"), false);
  assert.equal(cleaned.includes("00BFFF"), false);
  assert.match(cleaned, /Jawaharlal Nehru \(1889–1964\)/);
});

test("extractStructuredTablesFromHtml parses tables and excludes confusing Head of State columns", () => {
  const mockTableHtml = `
    <table class="wikitable">
      <tr>
        <th>Portrait</th>
        <th>Prime Minister</th>
        <th>Term</th>
        <th>Party</th>
        <th>Head of State</th>
      </tr>
      <tr>
        <td><img src="nehru.jpg" /></td>
        <td>Jawaharlal Nehru</td>
        <td>1947–1964</td>
        <td>Indian National Congress</td>
        <td>King George VI</td>
      </tr>
      <tr>
        <td><img src="modi.jpg" /></td>
        <td>Narendra Modi</td>
        <td>2014–Present</td>
        <td>BJP</td>
        <td>Droupadi Murmu</td>
      </tr>
    </table>
  `;
  const tables = extractStructuredTablesFromHtml(mockTableHtml);
  assert.equal(tables.length, 1);
  const tableText = tables[0];
  assert.match(tableText, /Jawaharlal Nehru/);
  assert.match(tableText, /Narendra Modi/);
  // Confusing Head of State column and Portrait column must be omitted from PM data
  assert.equal(tableText.includes("King George VI"), false);
  assert.equal(tableText.includes("Droupadi Murmu"), false);
});

test("formatSearchResultsForContext includes detailed factual reference content", () => {
  const resultWithContent = {
    success: true,
    results: [
      {
        title: "List of Prime Ministers",
        url: "https://en.wikipedia.org/wiki/List_of_prime_ministers",
        snippet: "Chronological list of prime ministers.",
        articleContent: "1. Jawaharlal Nehru (1947–1964)\n2. Narendra Modi (2014–Present)",
      },
    ],
  };
  const formatted = formatSearchResultsForContext(resultWithContent);
  assert.match(formatted, /Detailed Factual Reference Content:/);
  assert.match(formatted, /1\. Jawaharlal Nehru/);
  assert.match(formatted, /2\. Narendra Modi/);
});

test("executeAgenticToolCall routes shell commands to executeBackgroundShellCommand", async () => {
  let executedShell = null;
  let executedCmd = null;
  const fakeContext = {
    executeBackgroundShellCommand: async (shellType, cmd) => {
      executedShell = shellType;
      executedCmd = cmd;
      return { success: true, message: "Command executed in background." };
    },
  };

  const res = await executeAgenticToolCall(
    {
      function: {
        name: "open_application",
        arguments: JSON.stringify({ application: "powershell", text: "Get-Date" }),
      },
    },
    fakeContext
  );

  assert.equal(res.success, true);
  assert.equal(executedShell, "powershell");
  assert.equal(executedCmd, "Get-Date");
  assert.match(res.message, /background/);
});

