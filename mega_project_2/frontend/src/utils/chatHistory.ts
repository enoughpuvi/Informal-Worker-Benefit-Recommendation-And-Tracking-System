/**
 * chatHistory.ts — Persist chat conversations in localStorage and
 * provide share utilities (copy to clipboard, Web Share API, download).
 *
 * No external dependencies.
 */

// ─── Storage Keys ───
const CHATBOT_SESSIONS_KEY = 'apana_chatbot_sessions';
const CHATBOT_ACTIVE_KEY = 'apana_chatbot_active_session';
const VOICE_STORAGE_KEY = 'apana_voice_history';

// ─── Types ───
export interface StoredChatMessage {
  sender: 'user' | 'bot';
  text: string;
  schemes?: { scheme_id: string; scheme_name: string }[];
  model?: string;
  time: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredVoiceEntry {
  question: string;
  answer: string;
  schemes: { scheme_id: string; scheme_name: string }[];
  model: string;
  time: string;
}

// ─── Session-based Chatbot Storage (ChatGPT-style) ───

/** Generate a short unique ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Extract a short title from the first user message */
export function extractSessionTitle(messages: StoredChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.sender === 'user');
  if (!firstUserMsg) return 'New Chat';
  const text = firstUserMsg.text.trim();
  return text.length > 45 ? text.slice(0, 45) + '…' : text;
}

/** Load all chat sessions */
export function loadChatSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATBOT_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

/** Save all chat sessions */
export function saveChatSessions(sessions: ChatSession[]): void {
  try {
    // Keep last 30 sessions max
    const toSave = sessions.slice(-30);
    localStorage.setItem(CHATBOT_SESSIONS_KEY, JSON.stringify(toSave));
  } catch { /* quota exceeded */ }
}

/** Create a new empty session */
export function createNewSession(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Save a specific session (upsert into sessions list) */
export function saveSession(session: ChatSession): void {
  const sessions = loadChatSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  const updated = { ...session, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    sessions[idx] = updated;
  } else {
    sessions.push(updated);
  }
  saveChatSessions(sessions);
}

/** Delete a specific session */
export function deleteSession(sessionId: string): void {
  const sessions = loadChatSessions().filter((s) => s.id !== sessionId);
  saveChatSessions(sessions);
}

/** Load active session ID */
export function loadActiveSessionId(): string | null {
  return localStorage.getItem(CHATBOT_ACTIVE_KEY);
}

/** Save active session ID */
export function saveActiveSessionId(id: string): void {
  localStorage.setItem(CHATBOT_ACTIVE_KEY, id);
}

/** Clear all chatbot sessions */
export function clearAllSessions(): void {
  localStorage.removeItem(CHATBOT_SESSIONS_KEY);
  localStorage.removeItem(CHATBOT_ACTIVE_KEY);
}

// Legacy compat — used by share function
export function loadChatbotHistory(): StoredChatMessage[] {
  const sessions = loadChatSessions();
  const activeId = loadActiveSessionId();
  const active = sessions.find((s) => s.id === activeId);
  return active?.messages || [];
}

export function saveChatbotHistory(_messages: StoredChatMessage[]): void {
  // No-op — handled by session save now
}

export function clearChatbotHistory(): void {
  clearAllSessions();
}

// ─── Voice Assistant Storage ───

export function loadVoiceHistory(): StoredVoiceEntry[] {
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return [];
}

export function saveVoiceHistory(entries: StoredVoiceEntry[]): void {
  try {
    const toSave = entries.slice(-30);
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* quota exceeded — ignore */ }
}

export function clearVoiceHistory(): void {
  localStorage.removeItem(VOICE_STORAGE_KEY);
}

// ─── Share Utilities ───

/** Strip markdown for plain-text sharing */
function stripMd(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

/** Format chatbot messages into readable plain text */
export function formatChatForShare(messages: StoredChatMessage[]): string {
  const lines: string[] = [
    '── Apana AI Assistant – Chat History ──',
    '',
  ];
  for (const m of messages) {
    if (m.sender === 'user') {
      lines.push(`You (${m.time}): ${m.text}`);
    } else {
      lines.push(`Apana AI (${m.time}):`);
      lines.push(stripMd(m.text));
      if (m.schemes && m.schemes.length > 0) {
        lines.push(`Schemes: ${m.schemes.map((s) => s.scheme_name).join(', ')}`);
      }
    }
    lines.push('');
  }
  lines.push('── Shared from Apana Benefits Platform ──');
  return lines.join('\n');
}

/** Format voice conversation entries into readable plain text */
export function formatVoiceForShare(entries: StoredVoiceEntry[]): string {
  const lines: string[] = [
    '── Talk to Apana AI – Voice Chat History ──',
    '',
  ];
  for (const e of entries) {
    lines.push(`You (${e.time}): ${e.question}`);
    lines.push(`Apana AI:`);
    lines.push(stripMd(e.answer));
    if (e.schemes.length > 0) {
      lines.push(`Schemes: ${e.schemes.map((s) => s.scheme_name).join(', ')}`);
    }
    lines.push('');
  }
  lines.push('── Shared from Apana Benefits Platform ──');
  return lines.join('\n');
}

/** Copy text to clipboard — returns true if successful */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/** Use the Web Share API (works on mobile + some desktops) */
export async function shareViaWebShare(text: string, title: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      // User cancelled or error
      return false;
    }
  }
  return false;
}

/** Download chat as a .txt file */
export function downloadAsTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
