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
  templates: string[];
  musicCategories: string[];
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
  demoEnabled: false,
  demoAssetPath: "",
  demoThumbnail: "",
  demoTitle: "StoryTeller AI – Story to Audio Reel Demo",
  demoDescription: "Listen to the fixed demo, then create your own paid story-to-audio reel.",
  languages: ["Marathi", "Hindi", "English"],
  durations: [30, 45, 60],
  allowAutoDuration: true,
  maxDuration: 60,
  voiceProvider: "GOOGLE_CLOUD_TTS",
  voiceProviderEnabled: true,
  voiceModel: "standard",
  voices: [],
  voiceSamples: [
    { label: "Marathi male narrator", language: "Marathi", assetPath: "/storyteller/voices/marathi-male.mp3" },
    { label: "Hindi male narrator", language: "Hindi", assetPath: "/storyteller/voices/hindi-male.mp3" },
    { label: "English male narrator", language: "English", assetPath: "/storyteller/voices/english-male.mp3" },
  ],
  voiceStyles: ["Natural", "Storytelling", "Motivational", "Emotional", "Professional"],
  templates: ["Minimal", "Motivational", "Storytelling"],
  musicCategories: ["None", "Calm", "Motivational", "Emotional", "Cinematic", "Storytelling"],
  musicAssets: {},
  failurePolicy: "RETRY_THEN_REFUND",
  automaticRetryCount: 1,
};

export interface StorytellerInput {
  title: string;
  story: string;
  language: string;
  voice: string;
  voiceStyle: string;
  duration: number;
  music: string;
  template: string;
}

export function validateStorytellerConfig(value: StorytellerConfig): string[] {
  const errors: string[] = [];
  if (!value.productName.trim()) errors.push("Product name is required.");
  if (!Number.isFinite(value.reelPrice) || value.reelPrice <= 0) errors.push("Price must be greater than zero.");
  if (value.currency !== "INR") errors.push("Only INR is currently supported by the wallet.");
  if (!Number.isInteger(value.maxDuration) || value.maxDuration < 15 || value.maxDuration > 300) errors.push("Maximum duration must be between 15 and 300 seconds.");
  if (!value.languages.length) errors.push("At least one language is required.");
  if (value.voiceSamples.some(sample => !value.languages.includes(sample.language) || !sample.label.trim() || !sample.assetPath.startsWith("/storyteller/voices/"))) errors.push("Narration samples must use an enabled language and a valid StoryTeller audio asset.");
  if (!value.durations.length || value.durations.some(d => !Number.isInteger(d) || d <= 0 || d > value.maxDuration)) errors.push("Allowed durations are invalid.");
  if (value.automaticRetryCount < 0 || value.automaticRetryCount > 3) errors.push("Automatic retry count must be between 0 and 3.");
  return errors;
}

export function validateStorytellerInput(input: StorytellerInput, config: StorytellerConfig): string[] {
  const errors: string[] = [];
  if (!input.title?.trim() || input.title.trim().length > 120) errors.push("Title must be between 1 and 120 characters.");
  if (!input.story?.trim() || input.story.trim().length < 20 || input.story.length > 10000) errors.push("Story must be between 20 and 10,000 characters.");
  if (!config.languages.includes(input.language)) errors.push("Language is not enabled.");
  if (!config.durations.includes(input.duration) || input.duration > config.maxDuration) errors.push("Duration is not enabled.");
  if (!config.voiceStyles.includes(input.voiceStyle)) errors.push("Narration tone is not enabled.");
  if (!config.templates.includes(input.template)) errors.push("Template is not enabled.");
  if (!config.musicCategories.includes(input.music)) errors.push("Music category is not enabled.");
  if (config.voices.length && !config.voices.some(v => v.id === input.voice && v.language === input.language)) errors.push("The selected narrator is not enabled for this language.");
  if (input.voice === SANJAY_CUSTOM_VOICE_ID && !config.voices.some(v => v.id === SANJAY_CUSTOM_VOICE_ID && v.language === input.language)) errors.push("The selected custom narrator is not enabled for this language.");
  return errors;
}

export function publicStorytellerConfig(config: StorytellerConfig) {
  const { voiceProvider: _provider, voiceModel: _model, ...safe } = config;
  return safe;
}
