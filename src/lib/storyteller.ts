export const STORYTELLER_CONFIG_ID = "storyteller";

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
  enabled: true,
  loginRequired: true,
  productName: "StoryTeller AI",
  tagline: "Turn Your Story into an AI Voice Reel",
  description: "Convert your story into a professional AI voice reel with animated text, subtitles and background music.",
  reelPrice: 19,
  currency: "INR",
  demoEnabled: false,
  demoAssetPath: "",
  demoThumbnail: "",
  demoTitle: "How to Create a StoryTeller AI Reel",
  demoDescription: "Watch the fixed guide, then create your own paid AI voice reel.",
  languages: ["Marathi", "Hindi", "English"],
  durations: [30, 45, 60],
  allowAutoDuration: true,
  maxDuration: 60,
  voiceProvider: "GOOGLE_CLOUD_TTS",
  voiceProviderEnabled: true,
  voiceModel: "standard",
  voices: [],
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
  if (!config.voiceStyles.includes(input.voiceStyle)) errors.push("Voice style is not enabled.");
  if (!config.templates.includes(input.template)) errors.push("Template is not enabled.");
  if (!config.musicCategories.includes(input.music)) errors.push("Music category is not enabled.");
  if (config.voices.length && !config.voices.some(v => v.id === input.voice && v.language === input.language)) errors.push("Voice is not enabled for this language.");
  return errors;
}

export function publicStorytellerConfig(config: StorytellerConfig) {
  const { voiceProvider: _provider, voiceModel: _model, ...safe } = config;
  return safe;
}
