import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatbotApi } from '../services/api';
import {
  X, Send, Bot, Sparkles, ChevronRight, User,
  Share2, Copy, Download, Trash2, Check,
  MessageSquarePlus, History, ChevronLeft, MoreVertical,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { markdownToHtml } from '../utils/renderMarkdown';
import {
  loadChatSessions,
  saveSession,
  createNewSession,
  deleteSession,
  loadActiveSessionId,
  saveActiveSessionId,
  clearAllSessions,
  extractSessionTitle,
  formatChatForShare,
  copyToClipboard,
  shareViaWebShare,
  downloadAsTextFile,
  ChatSession,
  StoredChatMessage,
} from '../utils/chatHistory';

/* ─────────────── constants ─────────────── */

const WELCOME_TEXT =
  'Namaste! I am your AI Welfare Assistant. Ask me anything about welfare schemes, eligibility requirements, pension benefits, or application procedures in English or Hindi.';

function makeWelcomeMsg(): StoredChatMessage {
  return {
    sender: 'bot',
    text: WELCOME_TEXT,
    time: 'Just now',
  };
}

const SAMPLE_PROMPTS = [
  'What schemes are available for street vendors?',
  'How do I qualify for PM Shram Yogi Maan-dhan pension?',
  'निर्माण श्रमिकों (Construction) के लिए कौन से लाभ हैं?',
];

/* ─────────────── component ─────────────── */

export const ChatbotWidget: React.FC = () => {
  const { t } = useLanguage();

  /* ── widget open / history sidebar toggle ── */
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /* ── sessions state ── */
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  /* ── chat state ── */
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── menus ── */
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  /* ── initialise sessions on mount ── */
  useEffect(() => {
    const loaded = loadChatSessions();
    const activeId = loadActiveSessionId();
    let active = loaded.find((s) => s.id === activeId) || null;

    if (!active) {
      active = createNewSession();
      active.messages = [makeWelcomeMsg()];
      loaded.push(active);
      saveSession(active);
      saveActiveSessionId(active.id);
    }

    setSessions(loaded);
    setActiveSession(active);
  }, []);

  /* ── auto-scroll ── */
  useEffect(() => {
    if (isOpen && !showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isOpen, showHistory]);

  /* ── close share menu on outside click ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShareMenu]);

  /* ── helpers ── */

  const refreshSessions = useCallback(() => {
    setSessions(loadChatSessions());
  }, []);

  const switchSession = useCallback((session: ChatSession) => {
    setActiveSession(session);
    saveActiveSessionId(session.id);
    setShowHistory(false);
    setInput('');
  }, []);

  const handleNewChat = useCallback(() => {
    const newSess = createNewSession();
    newSess.messages = [makeWelcomeMsg()];
    saveSession(newSess);
    saveActiveSessionId(newSess.id);
    setActiveSession(newSess);
    refreshSessions();
    setShowHistory(false);
    setInput('');
  }, [refreshSessions]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession(id);
      const remaining = loadChatSessions();
      setSessions(remaining);

      if (activeSession?.id === id) {
        if (remaining.length > 0) {
          const latest = remaining[remaining.length - 1];
          setActiveSession(latest);
          saveActiveSessionId(latest.id);
        } else {
          handleNewChat();
        }
      }
      setConfirmDeleteId(null);
    },
    [activeSession, handleNewChat],
  );

  const handleClearAll = useCallback(() => {
    clearAllSessions();
    setSessions([]);
    handleNewChat();
  }, [handleNewChat]);

  /* ── send message ── */
  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading || !activeSession) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: StoredChatMessage = { sender: 'user', text: q, time: now };
    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: updatedMessages,
      title: extractSessionTitle(updatedMessages),
      updatedAt: new Date().toISOString(),
    };

    setActiveSession(updatedSession);
    saveSession(updatedSession);
    refreshSessions();
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotApi.query(q);
      const botMsg: StoredChatMessage = {
        sender: 'bot',
        text: res.answer,
        schemes: res.retrieved_schemes,
        model: res.model,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedSession.messages, botMsg];
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };
      setActiveSession(finalSession);
      saveSession(finalSession);
      refreshSessions();
    } catch {
      const errMsg: StoredChatMessage = {
        sender: 'bot',
        text: 'Sorry, I encountered an error connecting to the welfare database. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedSession.messages, errMsg];
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };
      setActiveSession(finalSession);
      saveSession(finalSession);
      refreshSessions();
    } finally {
      setLoading(false);
    }
  };

  /* ── share handlers ── */
  const currentMessages = activeSession?.messages || [];

  const handleCopy = async () => {
    const text = formatChatForShare(currentMessages);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowShareMenu(false);
  };

  const handleShare = async () => {
    const text = formatChatForShare(currentMessages);
    const shared = await shareViaWebShare(text, 'Apana AI Chat');
    if (!shared) await handleCopy();
    setShowShareMenu(false);
  };

  const handleDownload = () => {
    const text = formatChatForShare(currentMessages);
    const date = new Date().toISOString().slice(0, 10);
    downloadAsTextFile(text, `apana-ai-chat-${date}.txt`);
    setShowShareMenu(false);
  };

  /* ── date formatting ── */
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  /* ── sorted sessions (newest first) ── */
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  /* ─────────── Render ─────────── */

  return (
    <div className="fixed bottom-5 right-5 z-40">

      {/* ══════ Floating Toggle Button ══════ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left pr-1">
            <span className="text-xs font-extrabold block leading-tight">
              {t('ai_chatbot_title', 'Apana AI Assistant')}
            </span>
            <span className="text-[10px] text-emerald-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {t('ask_scheme_queries', 'Ask scheme queries')}
            </span>
          </div>
        </button>
      )}

      {/* ══════ Chat Window ══════ */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">

          {/* ══════ Header ══════ */}
          <div className="p-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {showHistory ? (
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-200" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm leading-tight">
                  {showHistory ? 'Chat History' : t('ai_chatbot_title', 'Apana AI Assistant')}
                </h3>
                {!showHistory && activeSession && (
                  <span className="text-[10px] text-emerald-200 truncate block max-w-[150px]">
                    {activeSession.title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* History toggle */}
              {!showHistory && (
                <button
                  onClick={() => { setShowHistory(true); refreshSessions(); }}
                  className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  title="Chat History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}

              {/* New chat */}
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="New Chat"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>

              {/* Share menu */}
              {!showHistory && (
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {copySuccess
                          ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                          : <Copy className="w-3.5 h-3.5" />}
                        {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share via...
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download as .txt
                      </button>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleClearAll}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Clear All History
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ══════ History Sidebar View ══════ */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {sortedSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <History className="w-10 h-10 opacity-40" />
                  <p className="text-xs font-medium">No chat history yet</p>
                  <button
                    onClick={handleNewChat}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Start a New Chat
                  </button>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sortedSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        s.id === activeSession?.id
                          ? 'bg-emerald-100 border border-emerald-200'
                          : 'hover:bg-slate-100 border border-transparent'
                      }`}
                      onClick={() => switchSession(s)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          s.id === activeSession?.id ? 'text-emerald-800' : 'text-slate-700'
                        }`}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(s.updatedAt)} · {s.messages.filter((m) => m.sender === 'user').length} messages
                        </p>
                      </div>

                      {/* Delete button */}
                      {confirmDeleteId === s.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                            className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                          className="p-1 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ══════ Chat Messages View ══════ */
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
                {currentMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}>
                      {m.sender === 'bot' ? (
                        <div
                          className="leading-relaxed space-y-0.5"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(m.text) }}
                        />
                      ) : (
                        <div className="whitespace-pre-line leading-relaxed">
                          {m.text}
                        </div>
                      )}

                      {/* Scheme links */}
                      {m.schemes && m.schemes.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Direct Scheme Matches:
                          </span>
                          {m.schemes.map((s: { scheme_id: string; scheme_name: string }) => (
                            <Link
                              key={s.scheme_id}
                              to={`/schemes/${s.scheme_id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold transition-colors"
                            >
                              <span className="truncate pr-2">{s.scheme_name}</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px] opacity-70">
                        <span>{m.model || ''}</span>
                        <span>{m.time}</span>
                      </div>
                    </div>

                    {m.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs pl-9">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.3s]" />
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.5s]" />
                    </div>
                    <span>Analyzing database schemes...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts — show when only welcome message */}
              {currentMessages.length === 1 && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-col gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400">Sample Questions:</span>
                  {SAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(p)}
                      className="text-left text-[11px] text-slate-700 hover:text-emerald-700 hover:bg-slate-50 p-1.5 rounded-lg border border-slate-200 truncate transition-colors"
                    >
                      &quot;{p}&quot;
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about schemes, eligibility, documents..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
