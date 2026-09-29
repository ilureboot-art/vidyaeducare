export const STORYTELLER_CONFIG_ID = "storyteller";
export const SANJAY_CUSTOM_VOICE_ID = "SANJAY_VOICE";

export type StorytellerFailurePolicy = "RETRY_THEN_REFUND" | "RETRY_ONLY" | "REFUND";
export type StorytellerStatus = "PAYMENT_PENDING" | "PAID" | "QUEUED" | "GENERATING" | "READY" | "FAILED" | "REFUNDED";

export interface StorytellerConfig {
  enabled: boolean;
  loginRequired: true;
  productName: string;
  tagline: string;
  description: string;
  reelPrice: number;
  durationPrices: Record<string, number>;
  currency: "INR";
  demoEnabled: boolean;
  demoAssetPath: string;
  demoThumbnail: string;
  demoTitle: string;
  demoDescription: string;
  languages: string[];
  durations: number[];
  allowAutoDuration: boolean;
  maxDuration: number;
  voiceProvider: string;
  voiceProviderEnabled: boolean;
  voiceModel: string;
  voices: Array<{ id: string; label: string; language: string; gender: "MALE" | "FEMALE" }>;
  voiceSamples: Array<{ label: string; language: string; assetPath: string }>;
  voiceStyles: string[];
  genres: string[];
  musicCategories: string[];
  soundEffectsEnabled: boolean;
  dynamicDuckingEnabled: boolean;
  maxVoiceUploadMb: number;
  allowedVoiceMimeTypes: string[];
  musicAssets: Record<string, string>;
  failurePolicy: StorytellerFailurePolicy;
  automaticRetryCount: number;
  updatedAt?: unknown;
  updatedBy?: string;
}

export const defaultStorytellerConfig: StorytellerConfig = {
  enabled: false,
  loginRequired: true,
  productName: "StoryTeller AI",
  tagline: "Turn Your Story into an AI Audio Reel",
  description: "Convert your story into an impactful audio reel with narration, story-aware sound design and a fixed cover.",
  reelPrice: 19,
  currency: "INR",
  demoEnabled: true,
  demoAssetPath: "/storyteller/demos/bed-khali-kon-aahe-cinematic-demo-v1.m4a",
  demoThumbnail: "",
  demoTitle: "बेड खाली कोण आहे? – Cinematic Audio Demo",
  demoDescription: "हा fixed StoryTeller AI cinematic audio demo ऐका; त्यानंतर तुमची स्वतःची paid story-to-audio reel तयार करा.",
  languages: ["Marathi", "Hindi", "English"],
  durationPrices: { "30": 19, "60": 29, "90": 39, "120": 49 },
  durations: [30, 60, 90, 120],
  allowAutoDuration: false,
  maxDuration: 120,
  voiceProvider: "OWN_VOICE_SYNTHESIS",
  voiceProviderEnabled: true,
  voiceModel: "standard",
  voices: [],
  voiceSamples: [
    { label: "Marathi male narrator", language: "Marathi", assetPath: "/storyteller/voices/marathi-male.mp3" },
    { label: "Hindi male narrator", language: "Hindi", assetPath: "/storyteller/voices/hindi-male.mp3" },
    { label: "English male narrator", language: "English", assetPath: "/storyteller/voices/english-male.mp3" },
  ],
  voiceStyles: ["Natural", "Dramatic", "Deep", "Soft", "Fast", "Slow"],
  genres: ["Horror", "Mystery", "Emotional", "Romantic", "Motivation", "Spiritual"],
  musicCategories: ["None", "Suspense", "Dark", "Calm", "Romantic", "Emotional", "Motivational", "Spiritual"],
  soundEffectsEnabled: true,
  dynamicDuckingEnabled: true,
  maxVoiceUploadMb: 20,
  allowedVoiceMimeTypes: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"],
  musicAssets: {},
  failurePolicy: "RETRY_THEN_REFUND",
  automaticRetryCount: 3,
};

export interface StorytellerInput {
  title: string;
  story: string;
  language: string;
  voiceReferenceId: string;
  voiceStyle: string;
  duration: number;
  music: string;
  genre: string;
  consentAccepted: boolean;
  consentVersion: string;
}

export const STORYTELLER_CONSENT_VERSION = "2026-09-28";

export function storytellerPriceForDuration(config: StorytellerConfig, duration: number) {
  return Number(config.durationPrices?.[String(duration)] ?? config.reelPrice);
}

export function validateStorytellerConfig(value: StorytellerConfig): string[] {
  const errors: string[] = [];
  if (!value.productName.trim()) errors.push("Product name is required.");
  if (!Number.isFinite(value.reelPrice) || value.reelPrice <= 0) errors.push("Price must be greater than zero.");
  if (value.durations.some(duration => !Number.isFinite(storytellerPriceForDuration(value, duration)) || storytellerPriceForDuration(value, duration) <= 0)) errors.push("Every duration must have a price greater than zero.");
  if (value.currency !== "INR") errors.push("Only INR is currently supported by the wallet.");
  if (!Number.isInteger(value.maxDuration) || value.maxDuration < 15 || value.maxDuration > 300) errors.push("Maximum duration must be between 15 and 300 seconds.");
  if (!value.languages.length) errors.push("At least one language is required.");
  if (value.voiceSamples.some(sample => !value.languages.includes(sample.language) || !sample.label.trim() || !sample.assetPath.startsWith("/storyteller/voices/"))) errors.push("Narration samples must use an enabled language and a valid StoryTeller audio asset.");
  if (!value.durations.length || value.durations.some(d => !Number.isInteger(d) || d <= 0 || d > value.maxDuration)) errors.push("Allowed durations are invalid.");
  if (value.automaticRetryCount < 0 || value.automaticRetryCount > 3) errors.push("Automatic retry count must be between 0 and 3.");
  if (!Number.isFinite(value.maxVoiceUploadMb) || value.maxVoiceUploadMb <= 0 || value.maxVoiceUploadMb > 20) errors.push("Voice upload limit must be between 1 and 20 MB.");
  if (!value.genres.length) errors.push("At least one genre is required.");
  return errors;
}

export function validateStorytellerInput(input: StorytellerInput, config: StorytellerConfig): string[] {
  const errors: string[] = [];
  if (!input.title?.trim() || input.title.trim().length > 120) errors.push("Title must be between 1 and 120 characters.");
  if (!input.story?.trim() || input.story.trim().length < 20 || input.story.length > 10000) errors.push("Story must be between 20 and 10,000 characters.");
  if (!config.languages.includes(input.language)) errors.push("Language is not enabled.");
  if (!config.durations.includes(input.duration) || input.duration > config.maxDuration) errors.push("Duration is not enabled.");
  if (!config.voiceStyles.includes(input.voiceStyle)) errors.push("Narration tone is not enabled.");
  if (!config.genres.includes(input.genre)) errors.push("Genre is not enabled.");
  if (!config.musicCategories.includes(input.music)) errors.push("Music category is not enabled.");
  if (!/^[A-Za-z0-9_-]{10,120}$/.test(input.voiceReferenceId || "")) errors.push("A valid own-voice reference is required.");
  if (input.consentAccepted !== true || input.consentVersion !== STORYTELLER_CONSENT_VERSION) errors.push("Current voice ownership and synthesis consent is required.");
  return errors;
}

export function publicStorytellerConfig(config: StorytellerConfig) {
  const { voiceProvider: _provider, voiceModel: _model, ...safe } = config;
  return safe;
}
