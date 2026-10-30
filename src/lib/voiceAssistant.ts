/**
 * Voice Assistant Response Engine
 *
 * Reads the CURRENT AnalysisResult and generates natural-language responses.
 * Supports English, Tamil, and Hindi.
 * Implements safety guardrails — never claims definitive authenticity or gives dosing advice.
 * Handles follow-up references ("it", "this medicine", "the barcode", "why", etc.)
 * by always pulling from the single source of truth: the current analysis state.
 */

import type { AnalysisResult } from '@/types';
import type { MatchStatus } from '@/lib/matchingEngine';

export type AssistantLang = 'en-IN' | 'ta-IN' | 'hi-IN';

export interface VoiceCommand {
  type: 'navigate' | 'download-report' | 'open-camera' | 'capture' | 'analyze' | 'stop-speaking' | 'switch-language' | 'none';
  lang?: AssistantLang;
  page?: 'scan' | 'result' | 'dashboard' | 'landing';
}

// ── Language labels ──────────────────────────────────────────────────────────

export const LANGUAGES: { code: AssistantLang; label: string; nativeLabel: string; srLang: string }[] = [
  { code: 'en-IN', label: 'English', nativeLabel: 'English', srLang: 'en-IN' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', srLang: 'ta-IN' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', srLang: 'hi-IN' },
];

// ── Safety guardrail phrases ─────────────────────────────────────────────────

const GUARDRAIL_PHRASES_EN = [
  'preliminary screening',
  'reference match',
  'potential inconsistency',
  'unable to verify',
  'consult a qualified pharmacist or healthcare professional',
];

// ── Command detection ────────────────────────────────────────────────────────

const COMMAND_PATTERNS: { patterns: string[]; command: VoiceCommand }[] = [
  // Navigation
  { patterns: ['open camera', 'start camera', 'turn on camera', 'கேமரா திற', 'கேமரா ஓபன்', 'कैमरा खोल', 'कैमरा चालू'], command: { type: 'navigate', page: 'scan' } },
  { patterns: ['show result', 'show the result', 'open result', 'முடிவு காட்டு', 'परिणाम दिखा'], command: { type: 'navigate', page: 'result' } },
  { patterns: ['go to dashboard', 'open dashboard', 'show dashboard', 'டாஷ்போர்டு', 'डैशबोर्ड खोल'], command: { type: 'navigate', page: 'dashboard' } },
  { patterns: ['go home', 'go to home', 'ஹோம்', 'होम पर जा'], command: { type: 'navigate', page: 'landing' } },
  // Download
  { patterns: ['download report', 'download the report', 'get report', 'download pdf', 'report download', 'report டவுன்லோட்', 'அறிக்கை பதிவிறக்க', 'रिपोर्ट डाउनलोड', 'रिपोर्ट दिलाओ'], command: { type: 'download-report' } },
  // Capture / analyze
  { patterns: ['take a photo', 'capture photo', 'take photo', 'capture', 'படம் எடு', 'फोटो ले', 'फोटो खींच'], command: { type: 'capture' } },
  { patterns: ['start analysis', 'analyze this', 'analyze the medicine', 'scan this', 'பகுப்பாய்வு செய்', 'विश्लेषण कर', 'जांच कर'], command: { type: 'analyze' } },
  // Stop speaking
  { patterns: ['stop speaking', 'stop talking', 'quiet', 'நிறுத்து', 'बंद कर', 'चुप'], command: { type: 'stop-speaking' } },
  // Language switching
  { patterns: ['speak in tamil', 'tamil பேசு', 'தமிழில் பேசு', 'switch to tamil', 'तमिल में बोल', 'तमिल भाषा'], command: { type: 'switch-language', lang: 'ta-IN' } },
  { patterns: ['speak in english', 'english பேசு', 'switch to english', 'अंग्रेजी में बोल', 'इंग्लिश'], command: { type: 'switch-language', lang: 'en-IN' } },
  { patterns: ['speak in hindi', 'hindi பேசு', 'switch to hindi', 'हिंदी में बोल', 'हिन्दी भाषा'], command: { type: 'switch-language', lang: 'hi-IN' } },
];

export function detectCommand(text: string): VoiceCommand {
  const lower = text.toLowerCase().trim();
  for (const { patterns, command } of COMMAND_PATTERNS) {
    for (const p of patterns) {
      if (lower.includes(p)) return command;
    }
  }
  return { type: 'none' };
}

// ── Intent classification ────────────────────────────────────────────────────

type Intent =
  | 'what-medicine'
  | 'who-makes'
  | 'barcode'
  | 'qr'
  | 'expiry'
  | 'batch'
  | 'score'
  | 'why-result'
  | 'ingredients'
  | 'strength'
  | 'dosage-form'
  | 'reference'
  | 'warnings'
  | 'is-genuine'
  | 'is-fake'
  | 'should-take'
  | 'download-report'
  | 'help'
  | 'unknown';

function classifyIntent(text: string): Intent {
  const l = text.toLowerCase();

  // Safety-sensitive intents first
  if (/\b(genuine|real|authentic|original|safe to take|is it safe)\b/.test(l)) return 'is-genuine';
  if (/\b(fake|counterfeit|spurious|not real)\b/.test(l)) return 'is-fake';
  if (/\b(should i take|can i take|take this medicine|stop taking|increase.*dose|dosage advice)\b/.test(l)) return 'should-take';

  if (/\b(download|report|pdf)\b/.test(l)) return 'download-report';
  if (/\b(what.*(medicine|drug|tablet|this)|what is this|identify)\b/.test(l)) return 'what-medicine';
  if (/\b(who.*(make|manufactur)|company|brand owner|made by)\b/.test(l)) return 'who-makes';
  if (/\b(barcode|bar code|upc|ean)\b/.test(l)) return 'barcode';
  if (/\b(qr|qr code|qr data)\b/.test(l)) return 'qr';
  if (/\b(expir|expiry|exp date)\b/.test(l)) return 'expiry';
  if (/\b(batch|lot number|lot no)\b/.test(l)) return 'batch';
  if (/\b(score|rating|how.*match|reference match)\b/.test(l)) return 'score';
  if (/\b(why|explain|reason|how come|ஏன்|விளக்க|क्यों|कारण)\b/.test(l)) return 'why-result';
  if (/\b(ingredient|composition|active|contains|what.*in it|உள்ளடக்க|सामग्री|घटक)\b/.test(l)) return 'ingredients';
  if (/\b(strength|mg|potency|அளவு|शक्ति|मिलीग्राम)\b/.test(l)) return 'strength';
  if (/\b(dosage form|tablet|capsule|syrup|injection|form)\b/.test(l)) return 'dosage-form';
  if (/\b(reference|database|openfda|rxnorm|registry|registered)\b/.test(l)) return 'reference';
  if (/\b(warning|caution|risk|alert|problem|issue)\b/.test(l)) return 'warnings';
  if (/\b(help|what can you|how to use|உதவி|मदद)\b/.test(l)) return 'help';
  return 'unknown';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nd(v: string): boolean {
  return !v || v === 'Not detected' || v === 'Not found' || v === 'N/A';
}

function statusText(status: MatchStatus, lang: AssistantLang): string {
  const map: Record<MatchStatus, Record<AssistantLang, string>> = {
    matched: { 'en-IN': 'matched', 'ta-IN': 'பொருந்துகிறது', 'hi-IN': 'मेल खाता है' },
    partial: { 'en-IN': 'partially matched', 'ta-IN': 'ஓரளவு பொருந்துகிறது', 'hi-IN': 'आंशिक रूप से मेल खाता है' },
    'not-matched': { 'en-IN': 'not matched', 'ta-IN': 'பொருந்தவில்லை', 'hi-IN': 'मेल नहीं खाता' },
    unavailable: { 'en-IN': 'unavailable', 'ta-IN': 'கிடைக்கவில்லை', 'hi-IN': 'अनुपलब्ध' },
  };
  return map[status][lang];
}

// ── Response generators ──────────────────────────────────────────────────────

function buildNoAnalysisResponse(lang: AssistantLang): string {
  if (lang === 'ta-IN') {
    return 'தற்போது பகுப்பாய்வு செய்யப்பட்ட மருந்து இல்லை. மருந்து படத்தை பதிவேற்றம் செய்து அல்லது கேமரா மூலம் படம் எடுத்து பகுப்பாய்வு செய்த பிறகு, என்னிடம் கேள்ளிகளை கேளுங்கள்.';
  }
  if (lang === 'hi-IN') {
    return 'वर्तमान में कोई दवा विश्लेषण उपलब्ध नहीं है। कृपया कोई दवा की तस्वीर अपलोड करें या कैमरा से फोटो लेकर विश्लेषण करें, फिर मुझसे प्रश्न पूछें।';
  }
  return 'There is no medicine analysis currently available. Please upload a medicine image or capture one with the camera and run the analysis first, then ask me questions about it.';
}

function buildHelpResponse(lang: AssistantLang): string {
  if (lang === 'ta-IN') {
    return 'நீங்கள் என்னிடம் கேட்கலாம்: "இந்த மருந்து என்ன?", "இதை யார் தயாரிக்கிறார்கள்?", "பார்கோட் பொருந்துகிறதா?", "expiry date என்ன?", "மதிப்பெண் எவ்வளவு?", "இந்த முடிவு ஏன் வந்தது?" அல்லது "அறிக்கை பதிவிறக்கம் செய்" என்று கேட்கலாம்.';
  }
  if (lang === 'hi-IN') {
    return 'आप मुझसे पूछ सकते हैं: "यह दवा क्या है?", "इसे कौन बनाता है?", "बारकोड मेल खाता है?", "एक्सपायरी डेट क्या है?", "स्कोर कितना है?", "यह परिणाम क्यों आया?", या "रिपोर्ट डाउनलोड करो"।';
  }
  return 'You can ask me: "What medicine is this?", "Who makes it?", "Does the barcode match?", "What is the expiry date?", "What is the score?", "Why did this result come?", or "Download report".';
}

function buildResponse(
  intent: Intent,
  analysis: AnalysisResult,
  lang: AssistantLang,
): string {
  const ocr = analysis.ocrData;
  const ref = analysis.referenceData;
  const match = analysis.matchingEvidence;
  const score = analysis.score;
  const isTamil = lang === 'ta-IN';
  const isHindi = lang === 'hi-IN';

  const name = nd(ocr.medicineName) ? 'Unknown' : ocr.medicineName;
  const generic = nd(ocr.genericName) ? 'Not detected' : ocr.genericName;
  const strength = nd(ocr.strength) ? 'Not detected' : ocr.strength;
  const dosageForm = nd(ocr.dosageForm) ? 'Not detected' : ocr.dosageForm;
  const manufacturer = nd(ocr.manufacturer) ? 'Not detected' : ocr.manufacturer;
  const batch = nd(ocr.batchNumber) ? 'Not detected' : ocr.batchNumber;
  const expiry = nd(ocr.expiryDate) ? 'Not detected' : ocr.expiryDate;
  const barcode = nd(ocr.barcode) ? 'Not detected' : ocr.barcode;

  switch (intent) {
    case 'what-medicine':
      if (isTamil) {
        return `படத்தில் கண்டறியப்பட்ட தகவலின் அடிப்படையில், இது ${name}${nd(strength) ? '' : ' ' + strength} ஆக இருக்கலாம். இது ஒரு preliminary screening ஆகும். ${ref.openFDA ? `Reference database-ல் இதற்கான பொருத்தம் கிடைத்துள்ளது.` : 'Reference database-ல் பொருத்தம் கிடைக்கவில்லை.'} மேலும் உறுதிப்படுத்த ஒரு தகுதியுள்ள மருந்தாளரை அணுகவும்.`;
      }
      if (isHindi) {
        return `तस्वीर से प्राप्त जानकारी के आधार पर, यह ${name}${nd(strength) ? '' : ' ' + strength} हो सकता है। यह एक प्रारंभिक जांच (preliminary screening) है। ${ref.openFDA ? 'Reference database में इसका मिलान मिला है।' : 'Reference database में मिलान नहीं मिला।'} अधिक पुष्टि के लिए एक योग्य फार्मासिस्ट से सलाह लें।`;
      }
      return `Based on the text detected from the image, this appears to be ${name}${nd(strength) ? '' : ' ' + strength}. This is a preliminary screening result. ${ref.openFDA ? 'A matching record was found in the reference database.' : 'No matching record was found in the reference database.'} This does not prove authenticity — please consult a qualified pharmacist or healthcare professional for confirmation.`;

    case 'who-makes':
      if (isTamil) {
        return nd(manufacturer) ? 'படத்திலிருந்து உற்பத்தியாளர் பெயர் கண்டறியப்படவில்லை.' : `கண்டறியப்பட்ட உற்பத்தியாளர்: ${manufacturer}.${ref.openFDA && !nd(ref.openFDA.manufacturerName) ? ` Reference database-ல் உள்ள உற்பத்தியாளர்: ${ref.openFDA.manufacturerName}.` : ''} ${match.manufacturerMatch.status === 'matched' ? 'இவை பொருந்துகின்றன.' : match.manufacturerMatch.status === 'partial' ? 'இவை ஓரளவு பொருந்துகின்றன.' : 'இவை பொருந்தவில்லை — இது ஒரு potential inconsistency ஆகும்.'}`;
      }
      if (isHindi) {
        return nd(manufacturer) ? 'तस्वीर से निर्माता का नाम नहीं मिला।' : `पहचाना गया निर्माता: ${manufacturer}.${ref.openFDA && !nd(ref.openFDA.manufacturerName) ? ` Reference database में निर्माता: ${ref.openFDA.manufacturerName}.` : ''} ${match.manufacturerMatch.status === 'matched' ? 'ये मेल खाते हैं।' : match.manufacturerMatch.status === 'partial' ? 'ये आंशिक रूप से मेल खाते हैं।' : 'ये मेल नहीं खाते — यह एक potential inconsistency है।'}`;
      }
      return nd(manufacturer) ? 'The manufacturer name could not be detected from the image.' : `The detected manufacturer is ${manufacturer}.${ref.openFDA && !nd(ref.openFDA.manufacturerName) ? ` The reference database lists the manufacturer as ${ref.openFDA.manufacturerName}.` : ''} ${match.manufacturerMatch.status === 'matched' ? 'These match.' : match.manufacturerMatch.status === 'partial' ? 'These partially match.' : 'These do not match — this is a potential inconsistency.'}`;

    case 'barcode':
      if (isTamil) {
        return nd(barcode) ? 'படத்தில் பார்கோட் கண்டறியப்படவில்லை. Identifier matching கிடைக்கவில்லை.' : `கண்டறியப்பட்ட பார்கோட்: ${barcode}. ${match.identifierMatch.status === 'matched' ? 'இது reference data-உடன் பொருந்துகிறது.' : match.identifierMatch.status === 'partial' ? 'இது ஓரளவு பொருந்துகிறது.' : match.identifierMatch.status === 'unavailable' ? 'பொருத்தம் சரிபார்க்க முடியவில்லை.' : 'இது reference data-உடன் பொருந்தவில்லை.'}`;
      }
      if (isHindi) {
        return nd(barcode) ? 'तस्वीर में बारकोड नहीं मिला।' : `पहचाना गया बारकोड: ${barcode}. ${match.identifierMatch.status === 'matched' ? 'यह reference data से मेल खाता है।' : match.identifierMatch.status === 'partial' ? 'यह आंशिक रूप से मेल खाता है।' : match.identifierMatch.status === 'unavailable' ? 'मिलान की जांच नहीं हो सकी।' : 'यह reference data से मेल नहीं खाता।'}`;
      }
      return nd(barcode) ? 'No barcode was detected in the image. Identifier matching is unavailable.' : `The detected barcode is ${barcode}. ${match.identifierMatch.status === 'matched' ? 'It matches the reference data.' : match.identifierMatch.status === 'partial' ? 'It partially matches the reference data.' : match.identifierMatch.status === 'unavailable' ? 'The match could not be verified.' : 'It does not match the reference data.'}`;

    case 'qr':
      if (isTamil) {
        return nd(ocr.qrData) ? 'படத்தில் QR குறியீடு கண்டறியப்படவில்லை.' : `கண்டறியப்பட்ட QR தரவு: ${ocr.qrData}`;
      }
      if (isHindi) {
        return nd(ocr.qrData) ? 'तस्वीर में QR कोड नहीं मिला।' : `पहचाना गया QR डेटा: ${ocr.qrData}`;
      }
      return nd(ocr.qrData) ? 'No QR code was detected in the image.' : `The detected QR code data is: ${ocr.qrData}`;

    case 'expiry':
      if (isTamil) {
        return nd(expiry) ? 'படத்திலிருந்து expiry date கண்டறியப்படவில்லை. பேக்கேஜில் expiry date தெளிவாக இருப்பதை உறுதிப்படுத்தவும்.' : `கண்டறியப்பட்ட expiry date: ${expiry}. இது பேக்கேஜில் உள்ள தகவலின் அடிப்படையில் உள்ளது.`;
      }
      if (isHindi) {
        return nd(expiry) ? 'तस्वीर से expiry date नहीं मिला।' : `पहचाना गया expiry date: ${expiry}`;
      }
      return nd(expiry) ? 'The expiry date could not be detected from the image. Make sure the expiry date is clearly visible on the package.' : `The detected expiry date is ${expiry}. This is based on the text read from the package.`;

    case 'batch':
      if (isTamil) {
        return nd(batch) ? 'படத்திலிருந்து batch number கண்டறியப்படவில்லை.' : `கண்டறியப்பட்ட batch number: ${batch}`;
      }
      if (isHindi) {
        return nd(batch) ? 'तस्वीर से batch number नहीं मिला।' : `पहचाना गया batch number: ${batch}`;
      }
      return nd(batch) ? 'The batch number could not be detected from the image.' : `The detected batch number is ${batch}.`;

    case 'score':
      if (isTamil) {
        return `Reference Match Score: ${score.score}/100. வகைப்படுத்தல்: ${score.classification}. OCR-இல் இருந்து கண்டறியப்பட்ட தகவல் மற்றும் reference database-உடன் ஒப்பிடப்பட்டது. இது preliminary screening ஆகும் — இது நம்பகத்தன்மையின் சான்று அல்ல.`;
      }
      if (isHindi) {
        return `Reference Match Score: ${score.score}/100. वर्गीकरण: ${score.classification}. यह OCR से प्राप्त जानकारी की reference database से तुलना पर आधारित है। यह preliminary screening है — यह प्रामाणिकता का प्रमाण नहीं है।`;
      }
      return `The Reference Match Score is ${score.score} out of 100. Classification: ${score.classification}. This score reflects how closely the text extracted from your image matches the reference database. This is a preliminary screening — it is not proof of authenticity.`;

    case 'why-result':
      if (isTamil) {
        const parts: string[] = [];
        parts.push(`முடிவு பின்வரும் ஆதாரங்களின் அடிப்படையில் வந்தது:`);
        parts.push(`மருந்தின் பெயர்: ${statusText(match.nameMatch.status, 'ta-IN')} (${match.nameMatch.confidence}%).`);
        parts.push(`உட்பொருள்: ${statusText(match.ingredientMatch.status, 'ta-IN')} (${match.ingredientMatch.confidence}%).`);
        parts.push(`வலிமை: ${statusText(match.strengthMatch.status, 'ta-IN')} (${match.strengthMatch.confidence}%).`);
        parts.push(`உற்பத்தியாளர்: ${statusText(match.manufacturerMatch.status, 'ta-IN')} (${match.manufacturerMatch.confidence}%).`);
        if (analysis.warnings.length > 0) parts.push(`எச்சரிக்கைகள்: ${analysis.warnings.length}.`);
        parts.push('இது preliminary screening ஆகும். மேலும் உறுதிப்படுத்த ஒரு தகுதியுள்ள மருந்தாளரை அணுகவும்.');
        return parts.join(' ');
      }
      if (isHindi) {
        const parts: string[] = [];
        parts.push(`परिणाम निम्न साक्ष्यों पर आधारित है:`);
        parts.push(`दवा का नाम: ${statusText(match.nameMatch.status, 'hi-IN')} (${match.nameMatch.confidence}%).`);
        parts.push(`घटक: ${statusText(match.ingredientMatch.status, 'hi-IN')} (${match.ingredientMatch.confidence}%).`);
        parts.push(`शक्ति: ${statusText(match.strengthMatch.status, 'hi-IN')} (${match.strengthMatch.confidence}%).`);
        parts.push(`निर्माता: ${statusText(match.manufacturerMatch.status, 'hi-IN')} (${match.manufacturerMatch.confidence}%).`);
        if (analysis.warnings.length > 0) parts.push(`चेतावनियाँ: ${analysis.warnings.length}.`);
        parts.push('यह preliminary screening है। अधिक पुष्टि के लिए योग्य फार्मासिस्ट से सलाह लें।');
        return parts.join(' ');
      }
      {
        const parts: string[] = [];
        parts.push(`The result is based on the following evidence:`);
        parts.push(`Medicine name: ${statusText(match.nameMatch.status, 'en-IN')} (${match.nameMatch.confidence}%).`);
        parts.push(`Active ingredient: ${statusText(match.ingredientMatch.status, 'en-IN')} (${match.ingredientMatch.confidence}%).`);
        parts.push(`Strength: ${statusText(match.strengthMatch.status, 'en-IN')} (${match.strengthMatch.confidence}%).`);
        parts.push(`Dosage form: ${statusText(match.dosageMatch.status, 'en-IN')} (${match.dosageMatch.confidence}%).`);
        parts.push(`Manufacturer: ${statusText(match.manufacturerMatch.status, 'en-IN')} (${match.manufacturerMatch.confidence}%).`);
        parts.push(`Identifier: ${statusText(match.identifierMatch.status, 'en-IN')} (${match.identifierMatch.confidence}%).`);
        if (analysis.warnings.length > 0) parts.push(`Warnings: ${analysis.warnings.length} note(s) were raised.`);
        parts.push('This is a preliminary screening. A database match does not prove authenticity — consult a qualified pharmacist or healthcare professional.');
        return parts.join(' ');
      }

    case 'ingredients':
      if (ref.openFDA && ref.openFDA.activeIngredients.length > 0) {
        const ingList = ref.openFDA.activeIngredients.map(ai => `${ai.name} (${ai.strength})`).join(', ');
        if (isTamil) return `Reference database-ப்படி, active ingredients: ${ingList}. படத்தில் கண்டறியப்பட்டது: ${generic}.`;
        if (isHindi) return `Reference database के अनुसार, active ingredients: ${ingList}. तस्वीर में पहचाना गया: ${generic}.`;
        return `According to the reference database, the active ingredients are: ${ingList}. From the image, the detected ingredient is: ${generic}.`;
      }
      if (isTamil) return `படத்தில் கண்டறியப்பட்ட active ingredient: ${generic}. Reference database-ல் கூடுதல் தகவல் கிடைக்கவில்லை.`;
      if (isHindi) return `तस्वीर में पहचाना गया active ingredient: ${generic}. Reference database में अतिरिक्त जानकारी नहीं मिली।`;
      return `The active ingredient detected from the image is: ${generic}. No additional ingredient information was found in the reference database.`;

    case 'strength':
      if (isTamil) return `கண்டறியப்பட்ட வலிமை: ${strength}. ${match.strengthMatch.status !== 'unavailable' ? `Reference data-உடன் ${statusText(match.strengthMatch.status, 'ta-IN')} (${match.strengthMatch.confidence}%).` : ''}`;
      if (isHindi) return `पहचानी गई शक्ति: ${strength}. ${match.strengthMatch.status !== 'unavailable' ? `Reference data के साथ ${statusText(match.strengthMatch.status, 'hi-IN')} (${match.strengthMatch.confidence}%).` : ''}`;
      return `The detected strength is ${strength}. ${match.strengthMatch.status !== 'unavailable' ? `Compared to the reference data: ${statusText(match.strengthMatch.status, 'en-IN')} (${match.strengthMatch.confidence}%).` : ''}`;

    case 'dosage-form':
      if (isTamil) return `கண்டறியப்பட்ட வடிவம்: ${dosageForm}. ${ref.openFDA && !nd(ref.openFDA.dosageForm) ? `Reference database-ப்படி: ${ref.openFDA.dosageForm}.` : ''}`;
      if (isHindi) return `पहचाना गया रूप: ${dosageForm}. ${ref.openFDA && !nd(ref.openFDA.dosageForm) ? `Reference database के अनुसार: ${ref.openFDA.dosageForm}.` : ''}`;
      return `The detected dosage form is ${dosageForm}. ${ref.openFDA && !nd(ref.openFDA.dosageForm) ? `The reference database lists it as ${ref.openFDA.dosageForm}.` : ''}`;

    case 'reference':
      if (isTamil) {
        if (ref.openFDA) return `openFDA database-ல் இந்த மருந்து காணப்பட்டது. Brand: ${ref.openFDA.brandName}, Generic: ${ref.openFDA.genericName}, NDC: ${ref.openFDA.productNdc}.`;
        if (ref.rxNorm) return `RxNorm database-ல் பொருத்தம் கிடைத்தது: ${ref.rxNorm.name} (RxCUI: ${ref.rxNorm.rxcui}).`;
        return 'Reference database-ல் பொருத்தம் கிடைக்கவில்லை. இது ஒரு potential inconsistency ஐ குறிக்கலாம்.';
      }
      if (isHindi) {
        if (ref.openFDA) return `openFDA database में यह दवा मिली। Brand: ${ref.openFDA.brandName}, Generic: ${ref.openFDA.genericName}, NDC: ${ref.openFDA.productNdc}.`;
        if (ref.rxNorm) return `RxNorm database में मिलान मिला: ${ref.rxNorm.name} (RxCUI: ${ref.rxNorm.rxcui}).`;
        return 'Reference database में मिलान नहीं मिला। यह एक potential inconsistency हो सकता है।';
      }
      if (ref.openFDA) return `This medicine was found in the openFDA database. Brand: ${ref.openFDA.brandName}, Generic: ${ref.openFDA.genericName}, NDC: ${ref.openFDA.productNdc}.`;
      if (ref.rxNorm) return `A match was found in RxNorm: ${ref.rxNorm.name} (RxCUI: ${ref.rxNorm.rxcui}).`;
      return 'No match was found in the reference databases. This may indicate a potential inconsistency. Please consult a qualified pharmacist or healthcare professional.';

    case 'warnings':
      if (analysis.warnings.length === 0) {
        if (isTamil) return 'எந்த எச்சரிக்கைகளும் இல்லை.';
        if (isHindi) return 'कोई चेतावनी नहीं है।';
        return 'No warnings were raised during the analysis.';
      }
      if (isTamil) return `பகுப்பாய்வில் ${analysis.warnings.length} எச்சரிக்கை(கள்) உள்ளன: ${analysis.warnings.join(' ')}`;
      if (isHindi) return `विश्लेषण में ${analysis.warnings.length} चेतावनी(याँ) हैं: ${analysis.warnings.join(' ')}`;
      return `There are ${analysis.warnings.length} warning(s) from the analysis: ${analysis.warnings.join(' ')}`;

    case 'is-genuine':
      if (isTamil) return 'நான் ஒரு மருந்து நிச்சயமாக உண்மையானது என்று சொல்ல முடியாது. இது ஒரு preliminary screening ஆகும். Reference database match என்பது நம்பகத்தன்மையின் சான்று அல்ல. தயவுசெய்து ஒரு தகுதியுள்ள மருந்தாளர் அல்லது சுகாதார நிபுணரை அணுகவும்.';
      if (isHindi) return 'मैं यह निश्चित रूप से नहीं कह सकता कि यह दवा असली है। यह एक preliminary screening है। Reference database match प्रामाणिकता का प्रमाण नहीं है। कृपया एक योग्य फार्मासिस्ट या स्वास्थ्य पेशेवर से सलाह लें।';
      return 'I cannot say whether a medicine is definitely genuine. This is a preliminary screening tool. A database match does not prove authenticity. Please consult a qualified pharmacist or healthcare professional for definitive verification.';

    case 'is-fake':
      if (isTamil) return 'நான் ஒரு மருந்து நிச்சயமாக போலி என்று சொல்ல முடியாது. இது ஒரு preliminary screening ஆகும். சில புலங்களில் potential inconsistency காணப்பட்டால், மேலும் சரிபார்க்க ஒரு தகுதியுள்ள மருந்தாளரை அணுகவும்.';
      if (isHindi) return 'मैं यह निश्चित रूप से नहीं कह सकता कि यह दवा नकली है। यह एक preliminary screening है। यदि कुछ क्षेत्रों में potential inconsistency है, तो अधिक जांच के लिए योग्य फार्मासिस्ट से संपर्क करें।';
      return 'I cannot say whether a medicine is definitely fake. This is a preliminary screening tool. If there are potential inconsistencies in some fields, please consult a qualified pharmacist or healthcare professional for further verification.';

    case 'should-take':
      if (isTamil) return 'நான் மருந்து உட்கொள்ளுதல் அல்லது அளவு பற்றிய ஆலோசனை வழங்க முடியாது. தயவுசெய்து ஒரு தகுதியுள்ள மருந்தாளர் அல்லது மருத்துவரை அணுகவும்.';
      if (isHindi) return 'मैं दवा लेने या खुराक के बारे में सलाह नहीं दे सकता। कृपया एक योग्य फार्मासिस्ट या डॉक्टर से सलाह लें।';
      return 'I cannot provide advice on whether to take a medicine or on dosage. Please consult a qualified pharmacist or healthcare professional.';

    case 'download-report':
      if (isTamil) return 'நான் அறிக்கையை பதிவிறக்கம் செய்ய தயாராக உள்ளேன். தயவுசெய்து "Download Report" பொத்தானை அழுத்தவும் அல்லது "Report download செய்" என்று குரலில் கேளுங்கள்.';
      if (isHindi) return 'मैं रिपोर्ट डाउनलोड करने के लिए तैयार हूं। कृपया "Download Report" बटन दबाएं या "रिपोर्ट डाउनलोड करो" बोलें।';
      return 'I can help download the report. Please tap the "Download Report" button or say "Download report" and I will trigger it.';

    case 'help':
      return buildHelpResponse(lang);

    default:
      if (isTamil) return `நான் உங்கள் கேள்வியை புரிந்துகொள்ள முடியவில்லை. நீங்கள் மருந்தின் பெயர், உற்பத்தியாளர், பார்கோட், expiry date, மதிப்பெண், அல்லது முடிவின் காரணம் பற்றி கேட்கலாம்.`;
      if (isHindi) return `मैं आपका प्रश्न नहीं समझ पाया। आप दवा का नाम, निर्माता, बारकोड, expiry date, स्कोर, या परिणाम का कारण पूछ सकते हैं।`;
      return `I didn't understand your question. You can ask about the medicine name, manufacturer, barcode, expiry date, score, or why the result came. Type "help" for suggestions.`;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function generateResponse(
  query: string,
  analysis: AnalysisResult | null,
  lang: AssistantLang,
): { content: string; isCommand: boolean; command: VoiceCommand } {
  const command = detectCommand(query);

  if (command.type !== 'none') {
    // For commands that are also questions (like "download report"), still generate a response
    if (command.type === 'download-report') {
      if (!analysis) {
        return { content: buildNoAnalysisResponse(lang), isCommand: true, command };
      }
      return { content: buildResponse('download-report', analysis, lang), isCommand: true, command };
    }
    // For other commands, return a brief acknowledgement
    if (lang === 'ta-IN') {
      return { content: 'சரி, அதைச் செய்கிறேன்.', isCommand: true, command };
    }
    if (lang === 'hi-IN') {
      return { content: 'ठीक है, मैं वह करता हूं।', isCommand: true, command };
    }
    return { content: 'Okay, doing that now.', isCommand: true, command };
  }

  if (!analysis) {
    return { content: buildNoAnalysisResponse(lang), isCommand: false, command: { type: 'none' } };
  }

  const intent = classifyIntent(query);
  const content = buildResponse(intent, analysis, lang);
  return { content, isCommand: false, command: { type: 'none' } };
}

export { GUARDRAIL_PHRASES_EN };
