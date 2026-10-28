/**
 * useSpeechRecognition Hook
 * 
 * Wraps the browser Web Speech API:
 * - SpeechRecognition / webkitSpeechRecognition for voice-to-text
 * - window.speechSynthesis for text-to-speech
 * 
 * 100% free — uses only built-in browser APIs, no paid services.
 * 
 * Browser Support:
 * - Chrome (desktop + Android): Full support for English, Hindi, Marathi
 * - Edge: Similar to Chrome (uses same engine)
 * - Safari: Partial support, Hindi/Marathi may not work
 * - Firefox: No SpeechRecognition support (text input fallback needed)
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Extend Window interface for webkitSpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: { new (): SpeechRecognitionInstance };
  webkitSpeechRecognition?: { new (): SpeechRecognitionInstance };
}

interface UseSpeechRecognitionReturn {
  /** Whether voice recognition is currently active */
  isListening: boolean;
  /** The recognized speech text */
  transcript: string;
  /** Error message (mic denied, no speech, etc.) or null */
  error: string | null;
  /** Whether this browser supports SpeechRecognition */
  isSupported: boolean;
  /** Whether speechSynthesis is currently speaking */
  isSpeaking: boolean;
  /** Start listening — pass BCP-47 lang code like 'en-IN', 'hi-IN', 'mr-IN' */
  startListening: (lang?: string) => void;
  /** Stop listening */
  stopListening: () => void;
  /** Speak text aloud — pass BCP-47 lang code */
  speak: (text: string, lang?: string) => void;
  /** Cancel current speech */
  stopSpeaking: () => void;
  /** Clear the transcript */
  resetTranscript: () => void;
}

/**
 * Strip markdown formatting before speaking text aloud.
 * Removes **, ###, -, bullet points, URLs, etc.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '')          // Remove ### headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
    .replace(/`([^`]+)`/g, '$1')        // Remove `code`
    .replace(/^\s*[-*•]\s+/gm, '')      // Remove bullet points
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) → link text
    .replace(/https?:\/\/\S+/g, '')     // Remove URLs
    .replace(/₹/g, 'rupees ')           // Speak ₹ as "rupees"
    .replace(/\n{2,}/g, '. ')           // Double newlines → pause
    .replace(/\n/g, '. ')               // Single newline → pause
    .trim();
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const windowObj = window as unknown as IWindow;
  const SpeechRecognitionClass = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognitionClass;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = useCallback((lang: string = 'en-IN') => {
    if (!SpeechRecognitionClass) {
      setError('Your browser does not support voice recognition. Please use Google Chrome.');
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = false;       // Stop after user finishes speaking
    recognition.interimResults = false;   // Only final results
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result && result[0]) {
        setTranscript(result[0].transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access was denied. Please allow microphone permission in your browser settings and try again.');
          break;
        case 'no-speech':
          setError('No speech was detected. Please tap the microphone and speak clearly.');
          break;
        case 'network':
          setError('A network error occurred. Speech recognition requires an internet connection in most browsers.');
          break;
        case 'audio-capture':
          setError('No microphone was found. Please connect a microphone and try again.');
          break;
        case 'aborted':
          // User or code cancelled — not an error to display
          break;
        default:
          setError(`Speech recognition error: ${event.error}. Please try again.`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Could not start voice recognition. Please try again.');
      setIsListening(false);
    }
  }, [SpeechRecognitionClass]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-IN') => {
    if (!window.speechSynthesis) {
      // speechSynthesis not available — fail silently
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 0.9;   // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
  };
}
