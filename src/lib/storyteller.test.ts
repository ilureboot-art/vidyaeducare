import { describe, expect, it } from "vitest";
import { defaultStorytellerConfig, STORYTELLER_CONSENT_VERSION, storytellerPriceForDuration, validateStorytellerConfig, validateStorytellerInput } from "./storyteller";

const validInput = { title: "A story", story: "This is a sufficiently long story for an audio reel.", language: "English", voiceReferenceId: "voiceRef_123456789", voiceStyle: "Natural", duration: 30, music: "None", genre: "Mystery", consentAccepted: true, consentVersion: STORYTELLER_CONSENT_VERSION };

describe("StoryTeller policy", () => {
  it("defaults to paid ₹19 reels with no free quota", () => {
    expect(defaultStorytellerConfig.reelPrice).toBe(19);
    expect(defaultStorytellerConfig.loginRequired).toBe(true);
    expect("freeQuota" in defaultStorytellerConfig).toBe(false);
  });
  it("uses the approved duration pricing", () => {
    expect(defaultStorytellerConfig.durations).toEqual([30, 60, 90, 120]);
    expect(defaultStorytellerConfig.durations.map(duration => storytellerPriceForDuration(defaultStorytellerConfig, duration))).toEqual([19, 29, 39, 49]);
  });
  it("rejects zero and negative pricing", () => {
    expect(validateStorytellerConfig({ ...defaultStorytellerConfig, reelPrice: 0 })).toContain("Price must be greater than zero.");
    expect(validateStorytellerConfig({ ...defaultStorytellerConfig, reelPrice: -19 })).toContain("Price must be greater than zero.");
  });
  it("validates choices against current admin configuration", () => {
    expect(validateStorytellerInput(validInput, defaultStorytellerConfig)).toEqual([]);
    expect(validateStorytellerInput({ ...validInput, duration: 45 }, defaultStorytellerConfig)).toContain("Duration is not enabled.");
    expect(validateStorytellerInput({ ...validInput, language: "French" }, defaultStorytellerConfig)).toContain("Language is not enabled.");
  });
  it("offers Marathi, Hindi and English and requires own-voice consent", () => {
    expect(defaultStorytellerConfig.languages).toEqual(["Marathi", "Hindi", "English"]);
    expect(validateStorytellerInput({ ...validInput, consentAccepted: false }, defaultStorytellerConfig)).toContain("Current voice ownership and synthesis consent is required.");
    expect(validateStorytellerInput({ ...validInput, voiceReferenceId: "" }, defaultStorytellerConfig)).toContain("A valid own-voice reference is required.");
  });
});


describe("Independent narrator controls", () => {
  it("keeps own voice off and permits AI without uploading a voice sample", () => {
    expect(defaultStorytellerConfig.ownVoiceEnabled).toBe(false);
    expect(validateStorytellerInput({...validInput,narrationMode:"AI",voiceReferenceId:""},defaultStorytellerConfig)).toEqual([]);
    expect(validateStorytellerInput({...validInput,narrationMode:"OWN_VOICE"},defaultStorytellerConfig)).toContain("Own voice is disabled.");
  });
  it("uses separate admin pricing and rejects disabled AI", () => {
    const config={...defaultStorytellerConfig,aiNarratorEnabled:false,aiDurationPrices:{"30":25}};
    expect(storytellerPriceForDuration(config,30,"AI")).toBe(25);
    expect(storytellerPriceForDuration(config,30,"OWN_VOICE")).toBe(19);
    expect(validateStorytellerInput({...validInput,narrationMode:"AI"},config)).toContain("AI narrator is disabled.");
  });
});
