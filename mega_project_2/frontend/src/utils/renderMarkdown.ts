/**
 * renderMarkdown — Converts simple markdown text to React-safe HTML.
 * 
 * Handles:
 *  - ### Headings → <strong> styled text
 *  - **bold text** → <strong>
 *  - *italic text* → <em>
 *  - `code` → <code>
 *  - - bullet items → styled list items
 *  - Line breaks preserved
 * 
 * No external dependencies — pure string processing.
 */

/**
 * Convert a markdown-formatted string into an HTML string
 * suitable for dangerouslySetInnerHTML rendering.
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const htmlLines: string[] = [];

  for (const line of lines) {
    let processed = line;

    // ### Heading → bold styled heading
    if (/^#{1,6}\s+/.test(processed)) {
      const content = processed.replace(/^#{1,6}\s+/, '');
      // Process inline formatting within the heading
      const formatted = inlineFormat(content);
      htmlLines.push(`<div class="font-bold text-base text-slate-900 mt-2 mb-1">${formatted}</div>`);
      continue;
    }

    // Bullet point lines: - item or * item or • item
    if (/^\s*[-*•]\s+/.test(processed)) {
      const content = processed.replace(/^\s*[-*•]\s+/, '');
      const formatted = inlineFormat(content);
      htmlLines.push(`<div class="flex items-start gap-1.5 ml-1"><span class="text-emerald-600 mt-0.5 shrink-0">•</span><span>${formatted}</span></div>`);
      continue;
    }

    // Empty line → spacer
    if (processed.trim() === '') {
      htmlLines.push('<div class="h-1.5"></div>');
      continue;
    }

    // Normal paragraph
    htmlLines.push(`<div>${inlineFormat(processed)}</div>`);
  }

  return htmlLines.join('');
}

/**
 * Process inline markdown formatting: **bold**, *italic*, `code`, ₹ symbol
 */
function inlineFormat(text: string): string {
  return text
    // **bold text** → <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    // *italic text* → <em>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // `code` → styled code span
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded text-[11px]">$1</code>')
    // ₹ amounts — highlight them
    .replace(/₹([\d,]+)/g, '<strong class="text-emerald-700">₹$1</strong>');
}
