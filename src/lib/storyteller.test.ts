import { describe, expect, it } from "vitest";
import { defaultStorytellerConfig, SANJAY_CUSTOM_VOICE_ID, validateStorytellerConfig, validateStorytellerInput } from "./storyteller";

const validInput = { title: "A story", story: "This is a sufficiently long story for a voice reel.", language: "English", voice: "", voiceStyle: "Natural", duration: 30, music: "None", template: "Minimal" };

describe("StoryTeller policy", () => {
  it("defaults to paid ₹19 reels with no free quota", () => {
    expect(defaultStorytellerConfig.reelPrice).toBe(19);
    expect(defaultStorytellerConfig.loginRequired).toBe(true);
    expect("freeQuota" in defaultStorytellerConfig).toBe(false);
  });
  it("rejects zero and negative pricing", () => {
    expect(validateStorytellerConfig({ ...defaultStorytellerConfig, reelPrice: 0 })).toContain("Price must be greater than zero.");
    expect(validateStorytellerConfig({ ...defaultStorytellerConfig, reelPrice: -19 })).toContain("Price must be greater than zero.");
  });
  it("validates choices against current admin configuration", () => {
    expect(validateStorytellerInput(validInput, defaultStorytellerConfig)).toEqual([]);
    expect(validateStorytellerInput({ ...validInput, duration: 90 }, defaultStorytellerConfig)).toContain("Duration is not enabled.");
    expect(validateStorytellerInput({ ...validInput, language: "French" }, defaultStorytellerConfig)).toContain("Language is not enabled.");
  });
  it("offers Marathi, Hindi and English, and requires explicit per-language custom voice activation", () => {
    expect(defaultStorytellerConfig.languages).toEqual(["Marathi", "Hindi", "English"]);
    for (const language of defaultStorytellerConfig.languages) {
      expect(validateStorytellerInput({ ...validInput, language, voice: SANJAY_CUSTOM_VOICE_ID }, defaultStorytellerConfig)).toContain("Sanjay custom voice is not enabled for this language.");
    }
    const config = { ...defaultStorytellerConfig, voices: [{ id: SANJAY_CUSTOM_VOICE_ID, label: "Sanjay Voice", language: "Hindi", gender: "MALE" as const }] };
    expect(validateStorytellerInput({ ...validInput, language: "Hindi", voice: SANJAY_CUSTOM_VOICE_ID }, config)).toEqual([]);
    expect(validateStorytellerInput({ ...validInput, language: "Marathi", voice: SANJAY_CUSTOM_VOICE_ID }, config)).toContain("Sanjay custom voice is not enabled for this language.");
  });
});
