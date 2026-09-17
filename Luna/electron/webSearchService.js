// ============================================================
// Luna Headless Web Search Service
// Powered by DuckDuckGo HTML/Lite + Deep Content Retrieval
// No external API keys required
// ============================================================

const SEARCH_TIMEOUT_MS = 12000;
const MAX_RESULTS = 5;

function decodeHtmlEntities(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeDuckDuckGoUrl(rawUrl) {
  if (!rawUrl) return "";
  const match = rawUrl.match(/uddg=([^&]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return rawUrl;
    }
  }
  return rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;
}

export function cleanHtmlText(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  let text = rawHtml;
  text = text.replace(/\s+data-[a-z0-9_-]+=(?:'[\s\S]*?'|"[\s\S]*?")/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, "");
  text = text.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "");
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<span[^>]*style="display:\s*none"[^>]*>[\s\S]*?<\/span>/gi, "");
  text = text.replace(/<br\s*\/?>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ");
  text = text.replace(/[0-9a-f]{6}\s*["']?\}\}+[\]'"}>]*/gi, "");
  text = text.replace(/["']?\}\}+[\]'"}>]*/g, "");
  text = text.replace(/#[0-9a-f]{6}/gi, "");
  return text.replace(/\s+/g, " ").trim();
}

export function extractStructuredTablesFromHtml(html) {
  if (!html) return [];
  const cleanHtml = html
    .replace(/\s+data-[a-z0-9_-]+=(['"])(?:\\.|(?!\1)[\s\S])*?\1/gi, "")
    .replace(/\s+data-[a-z0-9_-]+=(?:'[\s\S]*?'|"[\s\S]*?")/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const tables = [...cleanHtml.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
  const resultTables = [];

  for (const tableMatch of tables) {
    const tableBody = tableMatch[1];
    const rows = [...tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (rows.length < 3) continue;

    let headerCells = [];
    const headerRow = rows.find((r) => r[1].includes("<th"));
    if (headerRow) {
      headerCells = [...headerRow[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
        .map((m) => cleanHtmlText(m[1]).replace(/\[[a-zA-Z0-9_-]+\]/g, "").replace(/\s+MP\s+for.*$/i, "").trim())
        .filter((c) => c.length > 0);
    }

    const tableHeaderText = headerCells.join(" ").toLowerCase();
    if (tableHeaderText.startsWith("v t e") || tableHeaderText.includes("politics of") || tableHeaderText.includes("sidebar")) {
      continue;
    }

    const parsedRows = [];
    for (const r of rows) {
      const cellMatches = [...r[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)];
      const rawCells = cellMatches
        .map((m) => cleanHtmlText(m[1]).replace(/\[[a-zA-Z0-9_-]+\]/g, "").replace(/\s+MP\s+for.*$/i, "").trim())
        .filter((c) => c.length > 0);

      if (rawCells.length === 0) continue;
      // Skip sub-rows (rowspans from presidents/elections)
      if (headerCells.length >= 6 && rawCells.length < 4) continue;

      // Filter out unwanted cells (presidents, head of state, portfolios, portraits, age)
      const cells = rawCells.filter((c) => {
        // President / Head of State / Monarch names
        if (/Head of State|King George|Mountbatten|Rajendra Prasad|Radhakrishnan|Zakir Husain|V\. V\. Giri|Hidayatullah|Fakhruddin Ali|B\. D\. Jatti|Sanjiva Reddy|Zail Singh|Venkataraman|Shankar Dayal|K\. R\. Narayanan|Abdul Kalam|Pratibha Patil|Pranab Mukherjee|Ram Nath Kovind|Droupadi Murmu/i.test(c)) {
          return false;
        }
        // Portfolio text blobs
        if (/External Affairs|Home Affairs|Atomic Energy|Civil Aviation|Environment and Forests|Agriculture|Textiles|Urban Development|Non Conventional Energy|Chemicals and Fertilizers|Personnel, Public Grievances|Information and Broadcasting/i.test(c) && c.length > 20) {
          return false;
        }
        // Age when assumed office (e.g. "57 years 274 days")
        if (/^\d{2}\s+years,?\s+\d+\s+days$/i.test(c)) {
          return false;
        }
        // Portrait/Image placeholder
        if (/^portrait$|^image$|^photo$/i.test(c)) {
          return false;
        }
        return true;
      });

      if (cells.length >= 2) {
        parsedRows.push(cells);
      }
    }

    if (parsedRows.length >= 3) {
      const tableText = parsedRows.map((row) => row.join(" | ")).join("\n");
      if (tableText.length > 50 && !tableText.startsWith("v t e")) {
        resultTables.push(tableText);
      }
    }
  }

  // Prioritize primary/comprehensive tables with more rows over small summaries
  resultTables.sort((a, b) => {
    const aLines = a.split("\n").length;
    const bLines = b.split("\n").length;
    return bLines - aLines;
  });

  return resultTables;
}

export async function fetchDeepContent(url) {
  if (!url || !url.startsWith("http")) return "";
  try {
    // 1. Specialized Wikipedia extraction (fast, clean, highly structured)
    if (url.includes("wikipedia.org/wiki/")) {
      const pageTitle = url.split("/wiki/")[1].split("#")[0].split("?")[0];
      const pageUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const html = await res.text();
        const tables = extractStructuredTablesFromHtml(html);

        const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
          .map((m) => cleanHtmlText(m[1]).replace(/\[[a-zA-Z0-9_-]+\]/g, "").trim())
          .filter((p) => p.length > 60 && !p.startsWith("Coordinates:"));

        let combined = "";
        if (paragraphs.length > 0) {
          combined += "Summary Introduction:\n" + paragraphs.slice(0, 1).join("\n\n") + "\n\n";
        }

        if (tables.length > 0) {
          combined += "Structured Verified Data Tables:\n" + tables.slice(0, 2).join("\n\n---\n\n");
        }

        if (combined.trim()) {
          return combined.slice(0, 5500);
        }

        return cleanHtmlText(html).slice(0, 3000);
      }
    }

    // 2. General web page fetch
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return "";
    const html = await res.text();
    const tables = extractStructuredTablesFromHtml(html);
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => cleanHtmlText(m[1]))
      .filter((p) => p.length > 50);

    let content = "";
    if (paragraphs.length > 0) {
      content += paragraphs.slice(0, 6).join("\n\n") + "\n\n";
    }
    if (tables.length > 0) {
      content += "Tables:\n" + tables.join("\n\n");
    }

    if (content.trim()) {
      return content.slice(0, 8000);
    }

    return cleanHtmlText(html).slice(0, 4000);
  } catch {
    return "";
  }
}

export async function performWebSearch(query, options = {}) {
  const cleanQuery = String(query || "").trim().slice(0, 500);
  if (!cleanQuery) {
    return {
      success: false,
      query: "",
      results: [],
      message: "Search query is empty.",
    };
  }

  const timeoutMs = Number(options.timeoutMs) || SEARCH_TIMEOUT_MS;
  const maxResults = Math.min(Number(options.maxResults) || MAX_RESULTS, 10);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        query: cleanQuery,
        results: [],
        message: `Search engine returned HTTP status ${response.status}.`,
      };
    }

    const html = await response.text();

    const snippetRegex = /class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span|div)>/gi;
    const titleRegex = /class="result__title"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
    const urlRegex = /class="result__url"[^>]*href="([^"]*)"/gi;

    const snippets = [];
    let sMatch;
    while ((sMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(decodeHtmlEntities(sMatch[1]));
    }

    const titles = [];
    let tMatch;
    while ((tMatch = titleRegex.exec(html)) !== null) {
      titles.push(decodeHtmlEntities(tMatch[1]));
    }

    const urls = [];
    let uMatch;
    while ((uMatch = urlRegex.exec(html)) !== null) {
      urls.push(decodeDuckDuckGoUrl(uMatch[1]));
    }

    const count = Math.min(titles.length, snippets.length, maxResults);
    const results = [];

    for (let i = 0; i < count; i++) {
      if (titles[i] && snippets[i]) {
        results.push({
          title: titles[i],
          snippet: snippets[i],
          url: urls[i] || "",
        });
      }
    }

    if (results.length === 0) {
      return {
        success: true,
        query: cleanQuery,
        results: [],
        message: `No web results found for "${cleanQuery}".`,
      };
    }

    // Retrieve deep content for top result to provide rich factual data
    if (results[0]?.url) {
      const deepText = await fetchDeepContent(results[0].url);
      if (deepText) {
        results[0].articleContent = deepText;
      }
    }

    // If top 2 result is Wikipedia or educational, retrieve its content too
    if (results[1]?.url && (results[1].url.includes("wikipedia.org") || results[1].url.includes(".org") || results[1].url.includes(".gov"))) {
      const secondDeep = await fetchDeepContent(results[1].url);
      if (secondDeep) {
        results[1].articleContent = secondDeep;
      }
    }

    return {
      success: true,
      query: cleanQuery,
      results,
      message: `Found ${results.length} results for "${cleanQuery}".`,
    };
  } catch (error) {
    clearTimeout(timer);
    const isTimeout = error.name === "AbortError";
    return {
      success: false,
      query: cleanQuery,
      results: [],
      message: isTimeout
        ? "Web search timed out."
        : `Web search could not be completed: ${error.message}`,
    };
  }
}

export function formatSearchResultsForContext(searchResult) {
  if (!searchResult || !searchResult.success || !Array.isArray(searchResult.results) || searchResult.results.length === 0) {
    return "No web results found.";
  }

  return searchResult.results
    .map((item, idx) => {
      let entry = `[Source ${idx + 1}]: ${item.title} (${item.url})\nSummary: ${item.snippet}`;
      if (item.articleContent) {
        entry += `\nDetailed Factual Reference Content:\n${item.articleContent}`;
      }
      return entry;
    })
    .join("\n\n---\n\n");
}
