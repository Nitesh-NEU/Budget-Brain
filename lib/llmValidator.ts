/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * LLM Validator - AI-based result validation using Gemini API
 * Provides reasoning explanations and warning detection for budget allocations
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type {
  Allocation,
  Assumptions,
  ChannelPriors,
  ValidationWarning,
  Channel
} from "@/types/shared";

export interface LLMValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 confidence in the allocation
  reasoning: string;
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface OptimizationContext {
  budget: number;
  priors: ChannelPriors;
  assumptions: Assumptions;
  industryBenchmarks?: Record<Channel, number>;
}

export class LLMValidator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more consistent validation
      }
    });
  }

  /**
   * Validate an allocation using AI-based analysis
   */
  async validateAllocation(
    allocation: Allocation,
    context: OptimizationContext
  ): Promise<LLMValidationResult> {
    try {
      const prompt = this.buildValidationPrompt(allocation, context);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const response = result.response.text();
      const parsed = this.parseValidationResponse(response);
      
      return parsed;
    } catch (error) {
      console.error("LLM validation failed:", error);
      return this.createFallbackResult(allocation, context);
    }
  }

  /**
   * Generate reasoning explanation for a recommendation
   */
  async explainRecommendation(
    allocation: Allocation,
    assumptions: Assumptions
  ): Promise<string> {
    try {
      const prompt = this.buildExplanationPrompt(allocation, assumptions);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const response = result.response.text();
      
      // Extract explanation from JSON response or return raw text
      try {
        const parsed = JSON.parse(response);
        return parsed.explanation || response;
      } catch {
        return response.trim();
      }
    } catch (error) {
      console.error("Explanation generation failed:", error);
      return this.createFallbackExplanation(allocation, assumptions);
    }
  }

  /**
   * Flag potential issues with an allocation
   */
  async flagPotentialIssues(
    allocation: Allocation,
    priors: ChannelPriors
  ): Promise<ValidationWarning[]> {
    try {
      const prompt = this.buildIssueDetectionPrompt(allocation, priors);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const response = result.response.text();
      const parsed = this.parseIssueResponse(response);
      
      return parsed.warnings || [];
    } catch (error) {
      console.error("Issue detection failed:", error);
      return this.createFallbackWarnings(allocation, priors);
    }
  }

  /**
   * Build validation prompt for allocation analysis
   */
  private buildValidationPrompt(
    allocation: Allocation,
    context: OptimizationContext
  ): string {
    const { budget, priors, assumptions } = context;
    
    // Calculate expected performance for context
    const expectedMetrics = this.calculateExpectedMetrics(allocation, budget, priors);
    
    return `
You are an expert advertising budget allocation validator. Analyze the following budget allocation for potential issues and provide validation feedback.

ALLOCATION TO VALIDATE:
- Google Ads: ${(allocation.google * 100).toFixed(1)}% ($${(allocation.google * budget).toFixed(0)})
- Meta Ads: ${(allocation.meta * 100).toFixed(1)}% ($${(allocation.meta * budget).toFixed(0)})
- TikTok Ads: ${(allocation.tiktok * 100).toFixed(1)}% ($${(allocation.tiktok * budget).toFixed(0)})
- LinkedIn Ads: ${(allocation.linkedin * 100).toFixed(1)}% ($${(allocation.linkedin * budget).toFixed(0)})

CONTEXT:
- Total Budget: $${budget.toLocaleString()}
- Optimization Goal: ${assumptions.goal}
${assumptions.avgDealSize ? `- Average Deal Size: $${assumptions.avgDealSize}` : ''}
${assumptions.targetCAC ? `- Target CAC: $${assumptions.targetCAC}` : ''}

CHANNEL PERFORMANCE EXPECTATIONS:
${Object.entries(priors).map(([channel, prior]) => 
  `- ${channel.charAt(0).toUpperCase() + channel.slice(1)}: CPM $${prior.cpm[0]}-$${prior.cpm[1]}, CTR ${(prior.ctr[0]*100).toFixed(1)}-${(prior.ctr[1]*100).toFixed(1)}%, CVR ${(prior.cvr[0]*100).toFixed(1)}-${(prior.cvr[1]*100).toFixed(1)}%`
).join('\n')}

EXPECTED PERFORMANCE WITH THIS ALLOCATION:
- Total Impressions: ${expectedMetrics.totalImpressions.toLocaleString()}
- Total Clicks: ${expectedMetrics.totalClicks.toLocaleString()}
- Total Conversions: ${expectedMetrics.totalConversions.toFixed(0)}
${assumptions.goal === 'revenue' ? `- Expected Revenue: $${expectedMetrics.expectedRevenue.toLocaleString()}` : ''}
${assumptions.goal === 'cac' ? `- Expected CAC: $${expectedMetrics.expectedCAC.toFixed(2)}` : ''}

VALIDATION CRITERIA:
1. Channel allocation reasonableness (no channel should be extremely over/under-allocated)
2. Budget efficiency (spending should align with channel performance potential)
3. Goal alignment (allocation should support the optimization objective)
4. Risk assessment (identify potential performance risks)
5. Industry best practices compliance

Please provide your analysis in the following JSON format:
{
  "isValid": boolean,
  "confidence": number (0-1),
  "reasoning": "Detailed explanation of your validation assessment",
  "warnings": [
    {
      "type": "allocation_imbalance|budget_efficiency|goal_misalignment|performance_risk|industry_deviation",
      "message": "Specific warning message",
      "severity": "low|medium|high",
      "channel": "google|meta|tiktok|linkedin" (optional)
    }
  ],
  "suggestions": ["List of actionable improvement suggestions"]
}

Focus on practical insights that would help optimize the allocation further.
`;
  }

  /**
   * Build explanation prompt for recommendation reasoning
   */
  private buildExplanationPrompt(
    allocation: Allocation,
    assumptions: Assumptions
  ): string {
    return `
You are an expert advertising strategist. Explain why this budget allocation makes sense for the given business objectives.

RECOMMENDED ALLOCATION:
- Google Ads: ${(allocation.google * 100).toFixed(1)}%
- Meta Ads: ${(allocation.meta * 100).toFixed(1)}%
- TikTok Ads: ${(allocation.tiktok * 100).toFixed(1)}%
- LinkedIn Ads: ${(allocation.linkedin * 100).toFixed(1)}%

BUSINESS CONTEXT:
- Primary Goal: ${assumptions.goal}
${assumptions.avgDealSize ? `- Average Deal Size: $${assumptions.avgDealSize}` : ''}
${assumptions.targetCAC ? `- Target CAC: $${assumptions.targetCAC}` : ''}

CONSTRAINTS:
${assumptions.minPct ? Object.entries(assumptions.minPct).map(([ch, pct]) => `- ${ch} minimum: ${(pct * 100).toFixed(1)}%`).join('\n') : ''}
${assumptions.maxPct ? Object.entries(assumptions.maxPct).map(([ch, pct]) => `- ${ch} maximum: ${(pct * 100).toFixed(1)}%`).join('\n') : ''}

Provide a clear, business-focused explanation of:
1. Why this allocation is optimal for the stated goal
2. How each channel contributes to the overall strategy
3. Key strategic considerations that influenced the allocation
4. Expected outcomes and performance indicators

Return your response as JSON:
{
  "explanation": "Your detailed explanation here"
}

Keep the explanation concise but comprehensive, suitable for business stakeholders.
`;
  }

  /**
   * Build issue detection prompt for potential problems
   */
  private buildIssueDetectionPrompt(
    allocation: Allocation,
    priors: ChannelPriors
  ): string {
    return `
You are an advertising audit specialist. Identify potential issues with this budget allocation based on channel performance data and industry best practices.

ALLOCATION TO AUDIT:
- Google Ads: ${(allocation.google * 100).toFixed(1)}%
- Meta Ads: ${(allocation.meta * 100).toFixed(1)}%
- TikTok Ads: ${(allocation.tiktok * 100).toFixed(1)}%
- LinkedIn Ads: ${(allocation.linkedin * 100).toFixed(1)}%

CHANNEL PERFORMANCE DATA:
${Object.entries(priors).map(([channel, prior]) => 
  `${channel.toUpperCase()}:
  - CPM Range: $${prior.cpm[0]} - $${prior.cpm[1]}
  - CTR Range: ${(prior.ctr[0]*100).toFixed(2)}% - ${(prior.ctr[1]*100).toFixed(2)}%
  - CVR Range: ${(prior.cvr[0]*100).toFixed(2)}% - ${(prior.cvr[1]*100).toFixed(2)}%`
).join('\n\n')}

AUDIT FOCUS AREAS:
1. Allocation imbalances (over-concentration or under-utilization)
2. Performance efficiency mismatches
3. Risk concentration issues
4. Industry benchmark deviations
5. Channel synergy opportunities

Identify specific warnings and categorize them by severity. Return JSON format:
{
  "warnings": [
    {
      "type": "allocation_imbalance|performance_mismatch|risk_concentration|benchmark_deviation|synergy_opportunity",
      "message": "Specific issue description",
      "severity": "low|medium|high",
      "channel": "google|meta|tiktok|linkedin" (if channel-specific)
    }
  ]
}

Focus on actionable insights that could improve performance or reduce risk.
`;
  }

  /**
   * Calculate expected metrics for an allocation
   */
  private calculateExpectedMetrics(
    allocation: Allocation,
    budget: number,
    priors: ChannelPriors
  ) {
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    for (const channel of channels) {
      const spend = budget * allocation[channel];
      const avgCPM = (priors[channel].cpm[0] + priors[channel].cpm[1]) / 2;
      const avgCTR = (priors[channel].ctr[0] + priors[channel].ctr[1]) / 2;
      const avgCVR = (priors[channel].cvr[0] + priors[channel].cvr[1]) / 2;

      const impressions = (spend / avgCPM) * 1000;
      const clicks = impressions * avgCTR;
      const conversions = clicks * avgCVR;

      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += conversions;
    }

    return {
      totalImpressions,
      totalClicks,
      totalConversions,
      expectedRevenue: totalConversions * 1000, // Default deal size
      expectedCAC: totalConversions > 0 ? budget / totalConversions : 0
    };
  }

  /**
   * Parse validation response from LLM
   */
  private parseValidationResponse(response: string): LLMValidationResult {
    try {
      const cleaned = response.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      
      return {
        isValid: parsed.isValid ?? true,
        confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning ?? "No reasoning provided",
        warnings: this.validateWarnings(parsed.warnings ?? []),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      };
    } catch (error) {
      console.error("Failed to parse validation response:", error);
      return {
        isValid: true,
        confidence: 0.5,
        reasoning: "Unable to parse LLM validation response",
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Parse issue detection response from LLM
   */
  private parseIssueResponse(response: string): { warnings: ValidationWarning[] } {
    try {
      const cleaned = response.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      
      return {
        warnings: this.validateWarnings(parsed.warnings ?? [])
      };
    } catch (error) {
      console.error("Failed to parse issue response:", error);
      return { warnings: [] };
    }
  }

  /**
   * Validate and sanitize warning objects
   */
  private validateWarnings(warnings: any[]): ValidationWarning[] {
    if (!Array.isArray(warnings)) return [];
    
    return warnings
      .filter(w => w && typeof w === 'object')
      .map(w => ({
        type: w.type || "unknown",
        message: w.message || "No message provided",
        severity: ["low", "medium", "high"].includes(w.severity) ? w.severity : "medium",
        channel: ["google", "meta", "tiktok", "linkedin"].includes(w.channel) ? w.channel : undefined
      }))
      .slice(0, 10); // Limit to 10 warnings max
  }

  /**
   * Create fallback result when LLM validation fails
   */
  private createFallbackResult(
    allocation: Allocation,
    context: OptimizationContext
  ): LLMValidationResult {
    const warnings: ValidationWarning[] = [];
    
    // Basic heuristic checks
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    
    // Check for extreme allocations
    for (const channel of channels) {
      if (allocation[channel] > 0.7) {
        warnings.push({
          type: "allocation_imbalance",
          message: `${channel} allocation is very high (${(allocation[channel] * 100).toFixed(1)}%), consider diversifying`,
          severity: "medium",
          channel
        });
      }
      if (allocation[channel] < 0.05 && allocation[channel] > 0) {
        warnings.push({
          type: "allocation_imbalance", 
          message: `${channel} allocation is very low (${(allocation[channel] * 100).toFixed(1)}%), consider increasing or removing`,
          severity: "low",
          channel
        });
      }
    }

    return {
      isValid: warnings.filter(w => w.severity === "high").length === 0,
      confidence: 0.6, // Medium confidence for fallback
      reasoning: "LLM validation unavailable, using basic heuristic checks",
      warnings,
      suggestions: ["Consider running validation again when LLM service is available"]
    };
  }

  /**
   * Create fallback explanation when LLM explanation fails
   */
  private createFallbackExplanation(
    allocation: Allocation,
    assumptions: Assumptions
  ): string {
    const topChannel = Object.entries(allocation)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return `This allocation prioritizes ${topChannel} (${(allocation[topChannel as Channel] * 100).toFixed(1)}%) ` +
           `to optimize for ${assumptions.goal}. The distribution balances performance potential across channels ` +
           `while considering the specified constraints and business objectives.`;
  }

  /**
   * Create fallback warnings when LLM issue detection fails
   */
  private createFallbackWarnings(
    allocation: Allocation,
    priors: ChannelPriors
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    
    // Check for concentration risk
    const maxAllocation = Math.max(...channels.map(ch => allocation[ch]));
    if (maxAllocation > 0.6) {
      warnings.push({
        type: "risk_concentration",
        message: "High concentration in single channel may increase performance risk",
        severity: "medium"
      });
    }

    return warnings;
  }
}