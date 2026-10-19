import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatbotApi } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLanguage } from '../context/LanguageContext';
import { markdownToHtml } from '../utils/renderMarkdown';
import {
  loadVoiceHistory,
  saveVoiceHistory,
  clearVoiceHistory,
  formatVoiceForShare,
  copyToClipboard,
  shareViaWebShare,
  downloadAsTextFile,
} from '../utils/chatHistory';
import { Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Globe,
  AlertTriangle,
  Bot,
  User,
  RefreshCw,
  Keyboard,
  ChevronRight,
  Sparkles,
  Share2,
  Copy,
  Download,
  Trash2,
  Check,
} from 'lucide-react';

/** Voice language option */
interface VoiceLang {
  code: string;
  label: string;
  nativeLabel: string;
}

const VOICE_LANGUAGES: VoiceLang[] = [
  { code: 'en-IN', label: 'English', nativeLabel: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी (भारत)' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी (भारत)' },
];

/** Conversation entry */
interface ConversationEntry {
  question: string;
  answer: string;
  schemes: any[];
  model: string;
  time: string;
}

export const VoiceAssistantPage: React.FC = () => {
  const { t } = useLanguage();
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
  } = useSpeechRecognition();

  // State
  const [voiceLang, setVoiceLang] = useState<string>('en-IN');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [currentSchemes, setCurrentSchemes] = useState<any[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load persisted history on mount
  const [history, setHistory] = useState<ConversationEntry[]>(() => loadVoiceHistory());

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Persist history whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveVoiceHistory(history);
    }
  }, [history]);

  // Auto-submit when speech recognition finishes with a transcript
  useEffect(() => {
    if (!isListening && transcript && !autoSubmitted && !loading) {
      setAutoSubmitted(true);
      handleSubmit(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  // ─── Share handlers ───
  const handleCopy = async () => {
    const text = formatVoiceForShare(history);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleShare = async () => {
    const text = formatVoiceForShare(history);
    const shared = await shareViaWebShare(text, 'Talk to Apana AI - Chat');
    if (!shared) {
      await handleCopy();
    }
  };

  const handleDownload = () => {
    const text = formatVoiceForShare(history);
    const date = new Date().toISOString().slice(0, 10);
    downloadAsTextFile(text, `apana-voice-chat-${date}.txt`);
  };

  const handleClearHistory = () => {
    clearVoiceHistory();
    setHistory([]);
  };

  /** Submit a question to the chatbot API */
  const handleSubmit = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setCurrentAnswer(null);
    setCurrentSchemes([]);
    setCurrentModel('');

    try {
      const res = await chatbotApi.query(q);
      setCurrentAnswer(res.answer);
      setCurrentSchemes(res.retrieved_schemes || []);
      setCurrentModel(res.model || '');

      // Add to history
      setHistory((prev) => [
        ...prev,
        {
          question: q,
          answer: res.answer,
          schemes: res.retrieved_schemes || [],
          model: res.model || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Auto-speak the answer
      speak(res.answer, voiceLang);
    } catch {
      setCurrentAnswer('Sorry, I encountered an error connecting to the welfare database. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, speak, voiceLang]);

  /** Handle text input submission */
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      resetTranscript();
      setAutoSubmitted(false);
      handleSubmit(textInput.trim());
      setTextInput('');
    }
  };

  /** Handle mic button click */
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      setAutoSubmitted(false);
      resetTranscript();
      setCurrentAnswer(null);
      startListening(voiceLang);
    }
  };

  const selectedLangInfo = VOICE_LANGUAGES.find((l) => l.code === voiceLang) || VOICE_LANGUAGES[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ─── Header ─── */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {t('voice_assistant_title', 'Talk to Apana AI')}
              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                Free & Offline
              </span>
            </h1>
            <p className="text-sm text-slate-500">
              {t('voice_assistant_subtitle', 'Free Voice Assistant — Powered by Web Speech API')}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          No paid APIs • Uses browser built-in speech engine • Grounded in live scheme database
        </p>
      </div>

      {/* ─── Browser Not Supported Warning ─── */}
      {!isSupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {t('no_voice_support', 'Your browser does not support voice input.')}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Please use <strong>Google Chrome</strong> (desktop or Android) for full voice support.
              You can still type your questions below using the text input.
            </p>
          </div>
        </div>
      )}

      {/* ─── Language Selector ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            {t('voice_language', 'Voice Language')}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {VOICE_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setVoiceLang(lang.code)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  voiceLang === lang.code
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Microphone Section ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
        {/* Mic Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleMicClick}
            disabled={!isSupported}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center text-white transition-all shadow-lg focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:ring-emerald-200'
            }`}
            title={isListening ? 'Stop Listening' : 'Tap to Speak'}
          >
            {/* Pulsing ring when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
                <span className="absolute inset-[-4px] rounded-full animate-pulse border-2 border-red-300 opacity-60" />
              </>
            )}
            {isListening ? (
              <MicOff className="w-10 h-10 relative z-10" />
            ) : (
              <Mic className="w-10 h-10 relative z-10" />
            )}
          </button>

          {/* Status Text */}
          <div className="space-y-1">
            <p className={`text-sm font-bold ${isListening ? 'text-red-600' : 'text-slate-700'}`}>
              {isListening
                ? t('listening', 'Listening... Tap to Stop')
                : t('tap_to_speak', 'Tap to Speak')}
            </p>
            {/* Mic-active indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Microphone active
              </div>
            )}
            <p className="text-xs text-slate-400">
              Selected: {selectedLangInfo.nativeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Speech Error Display ─── */}
      {speechError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{speechError}</p>
        </div>
      )}

      {/* ─── Transcript Display (You Said) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">
            {t('you_said', 'You said:')}
          </span>
        </div>
        <div className={`min-h-[48px] p-3 rounded-xl border text-sm ${
          transcript
            ? 'bg-emerald-50 border-emerald-200 text-slate-800'
            : 'bg-slate-50 border-slate-200 text-slate-400 italic'
        }`}>
          {transcript || t('question_placeholder', 'Your question will appear here...')}
        </div>
      </div>

      {/* ─── Text Input Fallback ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">
            {t('type_question', 'Or type your question:')}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Ask about schemes, eligibility, documents..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handleTextSubmit}
            disabled={loading || !textInput.trim()}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-emerald-600">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.3s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.5s]" />
            </div>
            <span className="text-sm font-semibold">
              {t('analyzing_question', 'Analyzing your question...')}
            </span>
          </div>
        </div>
      )}

      {/* ─── Answer Display ─── */}
      {currentAnswer && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Answer Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-700">
                {t('ai_says', 'Apana AI says:')}
              </span>
            </div>
            {currentModel && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                {currentModel}
              </span>
            )}
          </div>

          {/* Answer Body */}
          <div className="p-4">
            <div
              className="text-sm text-slate-800 leading-relaxed space-y-0.5"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(currentAnswer) }}
            />

            {/* Scheme Links */}
            {currentSchemes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Direct Scheme Matches:
                </span>
                {currentSchemes.map((s: any) => (
                  <Link
                    key={s.scheme_id}
                    to={`/schemes/${s.scheme_id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-sm transition-colors"
                  >
                    <span className="truncate pr-2">{s.scheme_name}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-700" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Speech Controls */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap">
            {!isSpeaking ? (
              <>
                <button
                  onClick={() => speak(currentAnswer, voiceLang)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {t('speak_answer', 'Speak Answer')}
                </button>
                <button
                  onClick={() => speak(currentAnswer, voiceLang)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('speak_again', 'Speak Again')}
                </button>
              </>
            ) : (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" />
                {t('stop_speaking', 'Stop Speaking')}
              </button>
            )}
            {isSpeaking && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Speaking...
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Conversation History ─── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Conversation History</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Copy chat to clipboard"
              >
                {copySuccess ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Share chat"
              >
                <Share2 className="w-3 h-3" />
                Share
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Download as text file"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {history.map((entry, idx) => (
              <div key={idx} className="p-4 space-y-2">
                {/* Question */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">You • {entry.time}</p>
                    <p className="text-sm text-slate-800">{entry.question}</p>
                  </div>
                </div>
                {/* Answer */}
                <div className="flex items-start gap-2 ml-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Apana AI • {entry.model}</p>
                    <div
                      className="text-sm text-slate-700 leading-relaxed space-y-0.5 line-clamp-4"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(entry.answer) }}
                    />
                    {entry.schemes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.schemes.map((s: any) => (
                          <Link
                            key={s.scheme_id}
                            to={`/schemes/${s.scheme_id}`}
                            className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full hover:bg-emerald-100"
                          >
                            {s.scheme_name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </div>
      )}

    </div>
  );
};
