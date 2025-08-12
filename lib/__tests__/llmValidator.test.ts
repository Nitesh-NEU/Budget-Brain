/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Unit tests for LLMValidator service
 */

import { LLMValidator } from "../llmValidator";
import type { OptimizationContext } from "../llmValidator";
import type { Allocation, Assumptions, ChannelPriors } from "@/types/shared";

// Mock the Google Generative AI
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  })),
  SchemaType: {
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    ARRAY: "array"
  }
}));

describe("LLMValidator", () => {
  let validator: LLMValidator;
  let mockModel: any;

  const sampleAllocation: Allocation = {
    google: 0.4,
    meta: 0.3,
    tiktok: 0.2,
    linkedin: 0.1
  };

  const samplePriors: ChannelPriors = {
    google: {
      cpm: [10, 30],
      ctr: [0.02, 0.05],
      cvr: [0.02, 0.08]
    },
    meta: {
      cpm: [8, 25],
      ctr: [0.01, 0.03],
      cvr: [0.015, 0.06]
    },
    tiktok: {
      cpm: [5, 20],
      ctr: [0.015, 0.04],
      cvr: [0.01, 0.05]
    },
    linkedin: {
      cpm: [15, 40],
      ctr: [0.005, 0.02],
      cvr: [0.02, 0.1]
    }
  };

  const sampleAssumptions: Assumptions = {
    goal: "demos",
    avgDealSize: 5000,
    targetCAC: 500
  };

  const sampleContext: OptimizationContext = {
    budget: 10000,
    priors: samplePriors,
    assumptions: sampleAssumptions
  };

  beforeEach(() => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    mockModel = {
      generateContent: jest.fn()
    };

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    validator = new LLMValidator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateAllocation", () => {
    it("should validate allocation successfully with valid LLM response", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            isValid: true,
            confidence: 0.85,
            reasoning: "This allocation balances performance across channels effectively",
            warnings: [
              {
                type: "allocation_imbalance",
                message: "LinkedIn allocation is relatively low",
                severity: "low",
                channel: "linkedin"
              }
            ],
            suggestions: ["Consider increasing LinkedIn spend for B2B targeting"]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.validateAllocation(sampleAllocation, sampleContext);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.reasoning).toContain("balances performance");
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("allocation_imbalance");
      expect(result.suggestions).toHaveLength(1);
    });

    it("should handle invalid JSON response gracefully", async () => {
      const mockResponse = {
        response: {
          text: () => "Invalid JSON response"
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.validateAllocation(sampleAllocation, sampleContext);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning).toContain("Unable to parse");
      expect(result.warnings).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it("should handle API errors with fallback result", async () => {
      mockModel.generateContent.mockRejectedValue(new Error("API Error"));

      const result = await validator.validateAllocation(sampleAllocation, sampleContext);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(0.6);
      expect(result.reasoning).toContain("heuristic checks");
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      expect(result.suggestions).toContain("Consider running validation again when LLM service is available");
    });

    it("should detect extreme allocation issues in fallback", async () => {
      const extremeAllocation: Allocation = {
        google: 0.8, // Very high allocation
        meta: 0.1,
        tiktok: 0.05,
        linkedin: 0.05
      };

      mockModel.generateContent.mockRejectedValue(new Error("API Error"));

      const result = await validator.validateAllocation(extremeAllocation, sampleContext);

      expect(result.warnings.some(w => w.type === "allocation_imbalance")).toBe(true);
      expect(result.warnings.some(w => w.channel === "google")).toBe(true);
    });
  });

  describe("explainRecommendation", () => {
    it("should generate explanation successfully", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            explanation: "This allocation prioritizes Google Ads for maximum reach while maintaining balanced performance across other channels."
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.explainRecommendation(sampleAllocation, sampleAssumptions);

      expect(result).toContain("prioritizes Google Ads");
      expect(result).toContain("balanced performance");
    });

    it("should handle non-JSON response", async () => {
      const mockResponse = {
        response: {
          text: () => "This is a plain text explanation without JSON formatting."
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.explainRecommendation(sampleAllocation, sampleAssumptions);

      expect(result).toBe("This is a plain text explanation without JSON formatting.");
    });

    it("should provide fallback explanation on error", async () => {
      mockModel.generateContent.mockRejectedValue(new Error("API Error"));

      const result = await validator.explainRecommendation(sampleAllocation, sampleAssumptions);

      expect(result).toContain("prioritizes google");
      expect(result).toContain("optimize for demos");
    });
  });

  describe("flagPotentialIssues", () => {
    it("should detect potential issues successfully", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            warnings: [
              {
                type: "risk_concentration",
                message: "High concentration in Google Ads may increase risk",
                severity: "medium"
              },
              {
                type: "performance_mismatch",
                message: "LinkedIn allocation may be too low for B2B goals",
                severity: "low",
                channel: "linkedin"
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.flagPotentialIssues(sampleAllocation, samplePriors);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("risk_concentration");
      expect(result[0].severity).toBe("medium");
      expect(result[1].channel).toBe("linkedin");
    });

    it("should handle invalid warnings gracefully", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            warnings: [
              { type: "valid_warning", message: "Valid warning", severity: "low" },
              { invalid: "warning" }, // Invalid warning object
              null, // Null warning
              { type: "another_valid", message: "Another valid warning", severity: "invalid_severity" }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.flagPotentialIssues(sampleAllocation, samplePriors);

      expect(result).toHaveLength(3); // All warnings should be processed, invalid ones get defaults
      expect(result[0].type).toBe("valid_warning");
      expect(result[1].type).toBe("unknown"); // Invalid warning gets default type
      expect(result[2].severity).toBe("medium"); // Invalid severity should default to medium
    });

    it("should provide fallback warnings on error", async () => {
      const highConcentrationAllocation: Allocation = {
        google: 0.7, // High concentration
        meta: 0.15,
        tiktok: 0.1,
        linkedin: 0.05
      };

      mockModel.generateContent.mockRejectedValue(new Error("API Error"));

      const result = await validator.flagPotentialIssues(highConcentrationAllocation, samplePriors);

      expect(result.some(w => w.type === "risk_concentration")).toBe(true);
    });
  });

  describe("warning validation", () => {
    it("should validate warning severity values", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            warnings: [
              { type: "test", message: "Test", severity: "low" },
              { type: "test", message: "Test", severity: "medium" },
              { type: "test", message: "Test", severity: "high" },
              { type: "test", message: "Test", severity: "invalid" }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.flagPotentialIssues(sampleAllocation, samplePriors);

      expect(result[0].severity).toBe("low");
      expect(result[1].severity).toBe("medium");
      expect(result[2].severity).toBe("high");
      expect(result[3].severity).toBe("medium"); // Invalid should default to medium
    });

    it("should validate channel values", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            warnings: [
              { type: "test", message: "Test", severity: "low", channel: "google" },
              { type: "test", message: "Test", severity: "low", channel: "invalid_channel" },
              { type: "test", message: "Test", severity: "low" } // No channel
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.flagPotentialIssues(sampleAllocation, samplePriors);

      expect(result[0].channel).toBe("google");
      expect(result[1].channel).toBeUndefined(); // Invalid channel should be undefined
      expect(result[2].channel).toBeUndefined(); // No channel should be undefined
    });

    it("should limit warnings to maximum of 10", async () => {
      const warnings = Array.from({ length: 15 }, (_, i) => ({
        type: `warning_${i}`,
        message: `Warning ${i}`,
        severity: "low"
      }));

      const mockResponse = {
        response: {
          text: () => JSON.stringify({ warnings })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await validator.flagPotentialIssues(sampleAllocation, samplePriors);

      expect(result).toHaveLength(10); // Should be limited to 10
    });
  });
});