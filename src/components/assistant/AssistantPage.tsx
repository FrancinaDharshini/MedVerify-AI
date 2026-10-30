import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, Bot, User, AlertCircle, Sparkles, Volume2,
  VolumeX, Square, RotateCw, Trash2, Camera, FileDown, Scan,
  Globe, Loader2, CheckCircle2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { generateResponse, LANGUAGES, type AssistantLang } from '@/lib/voiceAssistant';
import { useVoiceRecognition, useSpeechSynthesis } from '@/lib/useVoice';
import { buildPdfData } from '@/lib/pdfDataBuilder';
import { generatePDF } from '@/lib/pdfGenerator';
import type { ChatMessage } from '@/types';

interface ExtendedChatMessage extends ChatMessage {
  fromVoice?: boolean;
}

const SUGGESTIONS_BY_LANG: Record<AssistantLang, string[]> = {
  'en-IN': [
    'What medicine is this?',
    'Who makes it?',
    'What is the expiry date?',
    'Why did this result come?',
    'Does the barcode match?',
    'Download report',
  ],
  'ta-IN': [
    'இந்த மருந்து என்ன?',
    'இதை யார் தயாரிக்கிறார்கள்?',
    'Expiry date என்ன?',
    'இந்த முடிவு ஏன் வந்தது?',
    'பார்கோட் பொருந்துகிறதா?',
    'Report download செய்',
  ],
  'hi-IN': [
    'यह दवा क्या है?',
    'इसे कौन बनाता है?',
    'Expiry date क्या है?',
    'यह परिणाम क्यों आया?',
    'बारकोड मेल खाता है?',
    'रिपोर्ट डाउनलोड करो',
  ],
};

export function AssistantPage() {
  const { currentAnalysis, navigate } = useApp();
  const [lang, setLang] = useState<AssistantLang>('en-IN');
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastAssistantText, setLastAssistantText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(lang);
  const currentAnalysisRef = useRef(currentAnalysis);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { currentAnalysisRef.current = currentAnalysis; }, [currentAnalysis]);

  // ── Handle voice result ────────────────────────────────────────────────────

  const handleVoiceResult = useCallback((text: string) => {
    processMessage(text, true);
  }, []);

  const handleVoiceError = useCallback((msg: string) => {
    setVoiceError(msg);
  }, []);

  const { voiceState, interimText, start: startListening, stop: stopListening, isSupported: isSRSupported } = useVoiceRecognition({
    lang,
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  const { isSpeaking, speak, stop: stopSpeaking, replay, isTTSSupported } = useSpeechSynthesis({
    lang,
    onEnd: () => {},
  });

  // ── Clear conversation when analysis changes ───────────────────────────────
  // When a NEW medicine is analyzed, old conversation context is cleared.
  const prevAnalysisId = useRef<string | null>(null);
  useEffect(() => {
    const currentId = currentAnalysis?.id ?? null;
    if (prevAnalysisId.current !== null && prevAnalysisId.current !== currentId) {
      setMessages([]);
      setLastAssistantText('');
    }
    prevAnalysisId.current = currentId;
  }, [currentAnalysis?.id]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, interimText]);

  // ── Process message (shared by voice + text) ───────────────────────────────

  const processMessage = useCallback((text: string, fromVoice: boolean) => {
    if (!text.trim()) return;
    setVoiceError(null);

    const userMsg: ExtendedChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      fromVoice,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Generate response synchronously (no API call needed — reads current analysis)
    setTimeout(() => {
      const result = generateResponse(text, currentAnalysisRef.current, langRef.current);
      const aiMsg: ExtendedChatMessage = {
        id: `m${Date.now() + 1}`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLastAssistantText(result.content);
      setIsTyping(false);

      // Handle commands
      if (result.isCommand && result.command.type !== 'none') {
        executeCommand(result.command);
      }

      // Auto-speak if the response came from voice input
      if (fromVoice && isTTSSupported) {
        speak(result.content);
      }
    }, 400);
  }, [speak, isTTSSupported]);

  // ── Command execution ──────────────────────────────────────────────────────

  const executeCommand = useCallback((cmd: { type: string; page?: string; lang?: AssistantLang }) => {
    switch (cmd.type) {
      case 'navigate':
        if (cmd.page) navigate(cmd.page as 'scan' | 'result' | 'dashboard' | 'landing');
        break;
      case 'download-report':
        if (currentAnalysisRef.current) {
          try {
            generatePDF(buildPdfData(currentAnalysisRef.current));
          } catch {
            // PDF generation failed silently
          }
        }
        break;
      case 'stop-speaking':
        stopSpeaking();
        break;
      case 'switch-language':
        if (cmd.lang) {
          setLang(cmd.lang);
          stopSpeaking();
        }
        break;
      // 'open-camera' navigates to scan page; 'capture' and 'analyze' need UI context
      // which requires the scan page, so we navigate there
      case 'open-camera':
        navigate('scan');
        break;
      case 'capture':
      case 'analyze':
        navigate('scan');
        break;
    }
  }, [navigate, stopSpeaking]);

  // ── UI handlers ────────────────────────────────────────────────────────────

  const handleMicToggle = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      setVoiceError(null);
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  const handleReplay = useCallback(() => {
    if (lastAssistantText) replay(lastAssistantText);
  }, [lastAssistantText, replay]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setLastAssistantText('');
    stopSpeaking();
  }, [stopSpeaking]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    processMessage(input, false);
  }, [input, processMessage]);

  const handleSuggestion = useCallback((s: string) => {
    processMessage(s, false);
  }, [processMessage]);

  const handleDownloadPDF = useCallback(() => {
    if (!currentAnalysis) return;
    try {
      generatePDF(buildPdfData(currentAnalysis));
    } catch {
      // PDF generation failed
    }
  }, [currentAnalysis]);

  const handleLangChange = useCallback((newLang: AssistantLang) => {
    setLang(newLang);
    stopSpeaking();
  }, [stopSpeaking]);

  const suggestions = SUGGESTIONS_BY_LANG[lang];
  const hasAnalysis = !!currentAnalysis;
  const micActive = voiceState === 'listening';

  return (
    <div className="min-h-screen pt-20 pb-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-3 text-xs font-mono text-primary-500">
            <Sparkles className="w-3.5 h-3.5" />
            Voice-Powered Medicine Assistant
          </div>
          <h1 className="font-display text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">FakeMed AI Assistant</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {lang === 'ta-IN'
              ? 'மருந்து பற்றி கேள்ளி கேளுங்கள். குரல் அல்லது உரை மூலம்.'
              : lang === 'hi-IN'
              ? 'दवा के बारे में प्रश्न पूछें। आवाज़ या टेक्स्ट द्वारा।'
              : 'Ask questions about your medicine. By voice or text.'}
          </p>
        </motion.div>

        {/* Context bar + Language selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-4 flex flex-col sm:flex-row gap-3">
          <GlassCard className="p-3 flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              {hasAnalysis ? (
                <>
                  <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
                    {currentAnalysis.ocrData.medicineName !== 'Not detected' ? currentAnalysis.ocrData.medicineName : 'Unknown medicine'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Score: {currentAnalysis.score.score}/100 · {currentAnalysis.scanMethod === 'camera' ? 'Camera' : 'Upload'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-400">No analysis loaded</p>
                  <p className="text-xs text-neutral-400">Analyze a medicine first</p>
                </>
              )}
            </div>
          </GlassCard>

          {/* Language selector */}
          <GlassCard className="p-2 flex items-center gap-1">
            <Globe className="w-4 h-4 text-neutral-400 ml-2 shrink-0" />
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  lang === l.code
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                aria-label={`Switch to ${l.label}`}
              >
                {l.nativeLabel}
              </button>
            ))}
          </GlassCard>
        </motion.div>

        {/* Main chat card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="p-0 overflow-hidden flex flex-col h-[480px]">
            {/* Status bar */}
            <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {voiceState === 'listening' && (
                  <span className="flex items-center gap-2 text-xs font-medium text-primary-500">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    Listening…
                  </span>
                )}
                {voiceState === 'processing' && (
                  <span className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
                  </span>
                )}
                {isSpeaking && (
                  <span className="flex items-center gap-2 text-xs font-medium text-success-500">
                    <Volume2 className="w-3.5 h-3.5" /> Speaking…
                  </span>
                )}
                {voiceState === 'idle' && !isSpeaking && (
                  <span className="text-xs text-neutral-400">Ready</span>
                )}
              </div>
              {/* TTS controls */}
              {isSpeaking && (
                <button onClick={handleStopSpeaking} className="flex items-center gap-1.5 text-xs font-medium text-danger-500 hover:text-danger-600 transition-colors">
                  <Square className="w-3.5 h-3.5" /> Stop
                </button>
              )}
              {!isSpeaking && lastAssistantText && isTTSSupported && (
                <button onClick={handleReplay} className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-primary-500 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" /> Replay
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Empty state */}
              {messages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary-500" />
                  </div>
                  <p className="text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {lang === 'ta-IN' ? 'உங்கள் மருந்து பற்றி கேளுங்கள்' : lang === 'hi-IN' ? 'अपनी दवा के बारे में पूछें' : 'Ask about your medicine'}
                  </p>
                  <p className="text-xs text-neutral-400 mb-4">
                    {lang === 'ta-IN' ? 'குரல் அல்லது உரை மூலம் கேள்ளிகளை கேளுங்கள்' : lang === 'hi-IN' ? 'आवाज़ या टेक्स्ट से प्रश्न पूछें' : 'Use voice or text to ask questions'}
                  </p>
                  {!hasAnalysis && (
                    <p className="text-xs text-warning-500 mb-4">
                      {lang === 'ta-IN' ? 'முதலில் ஒரு மருந்தை பகுப்பாய்வு செய்யவும்' : lang === 'hi-IN' ? 'पहले एक दवा विश्लेषण करें' : 'Analyze a medicine first'}
                    </p>
                  )}
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-primary-500/10' : 'bg-gradient-to-br from-primary-500 to-accent-500'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-primary-500" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl text-sm text-left ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'glass rounded-tl-sm'
                    }`}>
                      {msg.fromVoice && msg.role === 'user' && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70 mb-1">
                          <Mic className="w-3 h-3" /> Voice
                        </span>
                      )}
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Interim transcript while listening */}
              {interimText && (
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-500" />
                  </div>
                  <div className="max-w-[80%] text-right">
                    <div className="inline-block px-4 py-3 rounded-2xl bg-primary-500/20 text-neutral-600 dark:text-neutral-300 rounded-tr-sm text-sm italic">
                      {interimText}…
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary-500"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full glass hover:bg-primary-500/10 hover:text-primary-500 transition-all text-neutral-600 dark:text-neutral-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                {/* Microphone button */}
                <button
                  onClick={handleMicToggle}
                  disabled={!isSRSupported()}
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
                    micActive
                      ? 'bg-danger-500 text-white shadow-lg shadow-danger-500/30'
                      : isSRSupported()
                      ? 'bg-primary-500/10 text-primary-500 hover:bg-primary-500/20'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                  aria-label={micActive ? 'Stop listening' : 'Start voice input'}
                >
                  {micActive ? (
                    <>
                      {/* Animated rings while listening */}
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-danger-500"
                        animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <MicOff className="w-5 h-5 relative" />
                    </>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    lang === 'ta-IN' ? 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்...'
                    : lang === 'hi-IN' ? 'अपना प्रश्न यहां टाइप करें...'
                    : 'Type your question here...'
                  }
                  className="flex-1 px-4 py-3 rounded-xl glass border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />

                {/* Send button */}
                <Button
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>

              {/* Voice error message */}
              {voiceError && (
                <div className="mt-2 p-2.5 rounded-lg bg-warning-500/10 border border-warning-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{voiceError}</p>
                </div>
              )}

              {/* Browser support warnings */}
              {!isSRSupported() && (
                <p className="mt-2 text-xs text-neutral-400">
                  {lang === 'ta-IN' ? 'இந்த browser-ல் voice recognition ஆதரிக்கப்படவில்லை. உரை உள்ளீட்டைப் பயன்படுத்தவும்.'
                  : lang === 'hi-IN' ? 'इस ब्राउज़र में voice recognition समर्थित नहीं है। टेक्स्ट इनपुट का उपयोग करें।'
                  : 'Voice recognition is not supported in this browser. Please use text input.'}
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick action buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Camera className="w-4 h-4" />} onClick={() => navigate('scan')}>
            {lang === 'ta-IN' ? 'கேமரா' : lang === 'hi-IN' ? 'कैमरा' : 'Open Camera'}
          </Button>
          <Button size="sm" variant="secondary" icon={<Scan className="w-4 h-4" />} onClick={() => navigate('scan')}>
            {lang === 'ta-IN' ? 'ஸ்கேன்' : lang === 'hi-IN' ? 'स्कैन' : 'Scan Medicine'}
          </Button>
          <Button size="sm" variant="secondary" icon={<FileDown className="w-4 h-4" />} onClick={handleDownloadPDF} disabled={!hasAnalysis}>
            {lang === 'ta-IN' ? 'அறிக்கை' : lang === 'hi-IN' ? 'रिपोर्ट' : 'Download Report'}
          </Button>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" icon={<Trash2 className="w-4 h-4" />} onClick={handleClearChat}>
              {lang === 'ta-IN' ? 'அழி' : lang === 'hi-IN' ? 'साफ' : 'Clear Chat'}
            </Button>
          )}
          {isSpeaking && (
            <Button size="sm" variant="danger" icon={<Square className="w-4 h-4" />} onClick={handleStopSpeaking}>
              {lang === 'ta-IN' ? 'நிறுத்து' : lang === 'hi-IN' ? 'बंद कर' : 'Stop Speaking'}
            </Button>
          )}
        </motion.div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
          <AlertCircle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {lang === 'ta-IN'
              ? 'FakeMed AI ஒரு தகவல் உதவியாளர். இது மருத்துவர் அல்லது மருந்தாளருக்கு மாற்று அல்ல. இது preliminary screening மட்டுமே — நம்பகத்தன்மையின் சான்று அல்ல. எந்த மருத்துவ அவசரத்திற்கும் சுகாதார நிபுணரை அணுகவும்.'
              : lang === 'hi-IN'
              ? 'FakeMed AI एक सूचना सहायक है। यह डॉक्टर या फार्मासिस्ट का विकल्प नहीं है। यह केवल preliminary screening है — प्रामाणिकता का प्रमाण नहीं। किसी भी चिकित्सा आपातकाल के लिए स्वास्थ्य पेशेवर से संपर्क करें।'
              : 'FakeMed AI is an informational assistant. It does not replace a doctor or pharmacist. This is a preliminary screening only — not proof of authenticity. For any medical emergency, consult a healthcare professional.'}
          </p>
        </div>
      </div>
    </div>
  );
}
