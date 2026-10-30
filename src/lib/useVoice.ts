/**
 * React hooks for Web Speech API: SpeechRecognition + SpeechSynthesis.
 * Handles cleanup, errors, and language switching.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssistantLang } from '@/lib/voiceAssistant';

// ── Types ────────────────────────────────────────────────────────────────────

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

// Minimal type defs for Web Speech API (not in standard TS lib)
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      length: number;
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ── useVoiceRecognition hook ─────────────────────────────────────────────────

export interface UseVoiceRecognitionOptions {
  lang: AssistantLang;
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
}

export function useVoiceRecognition({ lang, onResult, onError }: UseVoiceRecognitionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const langRef = useRef(lang);
  const shouldListenRef = useRef(false);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const isSupported = useCallback(() => getSpeechRecognitionCtor() !== null, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
    setVoiceState('idle');
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.('Speech recognition is not supported in this browser. Please use text input instead.');
      setVoiceState('error');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* noop */ }
    }

    const recognition = new Ctor();
    recognition.lang = langRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    shouldListenRef.current = true;

    recognition.onstart = () => {
      setVoiceState('listening');
      setInterimText('');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);

      if (finalText.trim()) {
        setInterimText('');
        setVoiceState('processing');
        shouldListenRef.current = false;
        onResultRef.current(finalText.trim());
      }
    };

    recognition.onerror = (e: { error: string; message?: string }) => {
      shouldListenRef.current = false;
      if (e.error === 'no-speech') {
        onErrorRef.current?.('No speech was detected. Please try again.');
      } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        onErrorRef.current?.('Microphone access was denied. Please allow microphone permission in your browser settings or use text input instead.');
      } else if (e.error === 'audio-capture') {
        onErrorRef.current?.('No microphone was detected. Please connect a microphone or use text input instead.');
      } else if (e.error === 'network') {
        onErrorRef.current?.('A network error occurred during speech recognition. Please check your connection and try again.');
      } else if (e.error === 'language-not-supported') {
        onErrorRef.current?.('The selected language is not supported for speech recognition in this browser. Please try English or use text input.');
      } else {
        onErrorRef.current?.(`Speech recognition error: ${e.error}. Please try again or use text input.`);
      }
      setVoiceState('error');
    };

    recognition.onend = () => {
      if (!shouldListenRef.current) {
        if (voiceState !== 'processing' && voiceState !== 'speaking') {
          setVoiceState('idle');
        }
        setInterimText('');
      } else {
        // Restart if still supposed to be listening
        try { recognition.start(); } catch { /* noop */ }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      onErrorRef.current?.('Could not start speech recognition. Please try again.');
      setVoiceState('error');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* noop */ }
      }
    };
  }, []);

  // Update language on existing recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  return { voiceState, interimText, start, stop, isSupported, setVoiceState };
}

// ── useSpeechSynthesis hook ──────────────────────────────────────────────────

export interface UseSpeechSynthesisOptions {
  lang: AssistantLang;
  onEnd?: () => void;
}

export function useSpeechSynthesis({ lang, onEnd }: UseSpeechSynthesisOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const onEndRef = useRef(onEnd);
  const langRef = useRef(lang);

  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Load voices (they load asynchronously in some browsers)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const pickVoice = useCallback((voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null => {
    // Try exact match first
    const exact = voices.find(v => v.lang === targetLang);
    if (exact) return exact;
    // Try prefix match (e.g., "ta" for "ta-IN")
    const prefix = targetLang.split('-')[0];
    const prefixMatch = voices.find(v => v.lang.startsWith(prefix));
    return prefixMatch || null;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown / excessive whitespace for cleaner speech
    const cleanText = text.replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langRef.current;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const voice = pickVoice(voices, langRef.current);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndRef.current?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEndRef.current?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [pickVoice]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const replay = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isTTSSupported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return { isSpeaking, speak, stop, replay, isTTSSupported, availableVoices };
}
