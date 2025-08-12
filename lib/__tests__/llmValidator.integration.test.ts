/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Integration tests for LLMValidator with AccuracyEnhancementService
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { Assumptions, ChannelPriors } from "@/types/shared";

// Mock the Google Generative AI
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            isValid: true,
            confidence: 0.8,
            reasoning: "This allocation provides good balance across channels for demo generation goals.",
            warnings: [
              {
                type: "allocation_balance",
                message: "Consider slightly increasing LinkedIn allocation for B2B targeting",
                severity: "low",
                channel: "linkedin"
              }
            ],
            suggestions: ["Monitor performance closely in first 30 days", "Consider A/B testing different allocations"]
          })
        }
      })
    })
  })),
  SchemaType: {
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    ARRAY: "array"
  }
}));

describe("LLMValidator Integration", () => {
  jest.setTimeout(10000); // Increase timeout to 10 seconds
  let service: AccuracyEnhancementService;

  const samplePriors: ChannelPriors = {
    google: {
      cpm: [12, 28],
      ctr: [0.025, 0.045],
      cvr: [0.03, 0.07]
    },
    meta: {
      cpm: [10, 22],
      ctr: [0.015, 0.035],
      cvr: [0.02, 0.055]
    },
    tiktok: {
      cpm: [8, 18],
      ctr: [0.02, 0.04],
      cvr: [0.015, 0.045]
    },
    linkedin: {
      cpm: [18, 35],
      ctr: [0.008, 0.018],
      cvr: [0.025, 0.08]
    }
  };

  const sampleAssumptions: Assumptions = {
    goal: "demos",
    avgDealSize: 4000,
    targetCAC: 400
  };

  beforeEach(() => {
    // Reset mock to default behavior
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            isValid: true,
            confidence: 0.8,
            reasoning: "This allocation provides good balance across channels for demo generation goals.",
            warnings: [
              {
                type: "allocation_balance",
                message: "Consider slightly increasing LinkedIn allocation for B2B targeting",
                severity: "low",
                channel: "linkedin"
              }
            ],
            suggestions: ["Monitor performance closely in first 30 days", "Consider A/B testing different allocations"]
          })
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    service = new AccuracyEnhancementService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should integrate LLM validation into enhancement pipeline", async () => {
    const result = await service.enhanceOptimization(
      15000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'standard',
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: true
      }
    );

    // Verify enhanced result structure
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('alternatives');

    // Verify LLM validation was included
    expect(result.validation.warnings.length).toBeGreaterThan(0);
    expect(result.validation.warnings.some(w => w.type === "allocation_balance")).toBe(true);

    // Verify reasoning explanation was enhanced
    expect(result.alternatives.reasoningExplanation).toContain("balance");

    // Verify confidence calculation includes LLM input
    expect(result.confidence.overall).toBeGreaterThan(0);
    expect(result.confidence.overall).toBeLessThanOrEqual(1);
  });

  it("should work with LLM validation disabled", async () => {
    const result = await service.enhanceOptimization(
      15000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'fast',
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      }
    );

    // Should still work without LLM validation
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('alternatives');

    // Should have basic validation warnings but not LLM-specific ones
    expect(result.validation.warnings.every(w => w.type !== "allocation_balance")).toBe(true);
  });

  it("should handle LLM validation timeout gracefully", async () => {
    // Mock a timeout scenario
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const mockModel = {
      generateContent: jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 100)
        )
      )
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    const result = await service.enhanceOptimization(
      15000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'standard',
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: true,
        timeoutMs: 5000
      }
    );

    // Should still return a valid result even if LLM validation fails
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('alternatives');
    expect(result.confidence.overall).toBeGreaterThan(0);
  });

  it("should include LLM warnings in final warning list", async () => {
    const result = await service.enhanceOptimization(
      10000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'thorough',
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: true
      }
    );

    // Should combine warnings from all sources
    expect(result.validation.warnings.length).toBeGreaterThan(0);
    
    // Should include the mocked LLM warning
    const llmWarning = result.validation.warnings.find(w => w.type === "allocation_balance");
    expect(llmWarning).toBeDefined();
    expect(llmWarning?.message).toContain("LinkedIn allocation");
    expect(llmWarning?.severity).toBe("low");
    expect(llmWarning?.channel).toBe("linkedin");
  });

  it("should use LLM reasoning in alternatives explanation", async () => {
    const result = await service.enhanceOptimization(
      20000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'standard',
        includeAlternatives: true,
        validateAgainstBenchmarks: false,
        enableLLMValidation: true
      }
    );

    // Should use LLM-generated reasoning instead of algorithm-based reasoning
    expect(result.alternatives.reasoningExplanation).toContain("balance across channels");
    expect(result.alternatives.reasoningExplanation).toContain("demo generation goals");
    
    // Should not contain algorithm-based reasoning patterns
    expect(result.alternatives.reasoningExplanation).not.toContain("Average algorithm confidence");
  });

  it("should adjust confidence calculation with LLM validation", async () => {
    // Test with high LLM confidence
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            isValid: true,
            confidence: 0.95, // High confidence
            reasoning: "Excellent allocation strategy",
            warnings: [],
            suggestions: []
          })
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    const result = await service.enhanceOptimization(
      15000,
      samplePriors,
      sampleAssumptions,
      {
        level: 'standard',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: true
      }
    );

    // High LLM confidence should positively impact overall confidence
    expect(result.confidence.overall).toBeGreaterThan(0.7);
  });
});