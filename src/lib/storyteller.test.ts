import { describe, expect, it } from "vitest";
import { defaultStorytellerConfig, validateStorytellerConfig, validateStorytellerInput } from "./storyteller";

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
});
