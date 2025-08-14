import type {
    Allocation,
    ChannelPriors,
    BenchmarkAnalysis,
    ValidationWarning,
    Channel,
    Assumptions
} from "../types/shared";

export interface BenchmarkThresholds {
    deviationWarning: number;
    extremeDeviation: number;
    minAllocation: number;
    maxAllocation: number;
}

export interface ValidationContext {
    budget: number;
    assumptions: Assumptions;
    industryType?: string;
    companySize?: 'small' | 'medium' | 'large';
}

const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];

const defaultThresholds: BenchmarkThresholds = {
    deviationWarning: 0.15,
    extremeDeviation: 0.30,
    minAllocation: 0.05,
    maxAllocation: 0.70
};

const industryBenchmarks = {
    standardAllocations: {
        google: [0.25, 0.50] as [number, number],
        meta: [0.20, 0.45] as [number, number],
        tiktok: [0.05, 0.25] as [number, number],
        linkedin: [0.05, 0.30] as [number, number]
    },
    performanceBasedAllocations: {
        google: 0.35,
        meta: 0.30,
        tiktok: 0.15,
        linkedin: 0.20
    },
    industryAdjustments: {
        'b2b': {
            google: 0.05,
            meta: -0.05,
            tiktok: -0.10,
            linkedin: 0.10
        },
        'ecommerce': {
            google: 0.10,
            meta: 0.10,
            tiktok: 0.05,
            linkedin: -0.25
        },
        'saas': {
            google: 0.05,
            meta: -0.05,
            tiktok: -0.05,
            linkedin: 0.05
        }
    },
    sizeAdjustments: {
        'small': {
            google: 0.10,
            meta: 0.05,
            tiktok: -0.10,
            linkedin: -0.05
        },
        'medium': {
            google: 0.00,  // No adjustment for medium companies
            meta: 0.00,
            tiktok: 0.00,
            linkedin: 0.00
        },
        'large': {
            google: -0.05,
            meta: -0.05,
            tiktok: 0.05,
            linkedin: 0.05
        }
    }
};

function calculatePerformanceBasedAllocations(priors: ChannelPriors): Record<Channel, number> {
    const performanceScores: Record<Channel, number> = {} as Record<Channel, number>;

    for (const channel of channels) {
        const cpmMid = (priors[channel].cpm[0] + priors[channel].cpm[1]) / 2;
        const ctrMid = (priors[channel].ctr[0] + priors[channel].ctr[1]) / 2;
        const cvrMid = (priors[channel].cvr[0] + priors[channel].cvr[1]) / 2;

        performanceScores[channel] = (ctrMid * cvrMid) / Math.max(cpmMid, 0.01);
    }

    const totalScore = channels.reduce((sum, ch) => sum + performanceScores[ch], 0);
    const allocations: Record<Channel, number> = {} as Record<Channel, number>;

    if (totalScore > 0) {
        for (const channel of channels) {
            allocations[channel] = performanceScores[channel] / totalScore;
        }
    } else {
        for (const channel of channels) {
            allocations[channel] = 0.25;
        }
    }

    return allocations;
}

function calculateExpectedAllocations(
    priors: ChannelPriors,
    context?: ValidationContext
): Record<Channel, number> {
    const performanceAllocations = calculatePerformanceBasedAllocations(priors);

    if (!context) {
        return performanceAllocations;
    }

    const adjustedAllocations = { ...performanceAllocations };

    if (context.industryType && industryBenchmarks.industryAdjustments[context.industryType as keyof typeof industryBenchmarks.industryAdjustments]) {
        const industryAdj = industryBenchmarks.industryAdjustments[context.industryType as keyof typeof industryBenchmarks.industryAdjustments];
        for (const channel of channels) {
            adjustedAllocations[channel] += industryAdj[channel] || 0;
        }
    }

    if (context.companySize && industryBenchmarks.sizeAdjustments[context.companySize]) {
        const sizeAdj = industryBenchmarks.sizeAdjustments[context.companySize];
        for (const channel of channels) {
            adjustedAllocations[channel] += sizeAdj[channel] || 0;
        }
    }

    const total = channels.reduce((sum, ch) => sum + Math.max(0, adjustedAllocations[ch]), 0);
    if (total > 0) {
        for (const channel of channels) {
            adjustedAllocations[channel] = Math.max(0, adjustedAllocations[channel]) / total;
        }
    }

    return adjustedAllocations;
}

function checkUnrealisticAllocation(
    channel: Channel,
    allocatedPct: number,
    standardRange: [number, number],
    thresholds: BenchmarkThresholds
): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (allocatedPct > 0 && allocatedPct < thresholds.minAllocation) {
        warnings.push({
            type: "unrealistic_allocation",
            message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) is below minimum viable threshold (${(thresholds.minAllocation * 100).toFixed(1)}%)`,
            severity: "medium",
            channel
        });
    }

    if (allocatedPct > thresholds.maxAllocation) {
        warnings.push({
            type: "unrealistic_allocation",
            message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) exceeds maximum recommended threshold (${(thresholds.maxAllocation * 100).toFixed(1)}%)`,
            severity: "high",
            channel
        });
    }

    const [minStandard, maxStandard] = standardRange;
    if (allocatedPct > 0 && (allocatedPct < minStandard || allocatedPct > maxStandard)) {
        const severity = (allocatedPct < minStandard * 0.5 || allocatedPct > maxStandard * 1.5) ? "high" : "medium";
        warnings.push({
            type: "industry_range_deviation",
            message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) is outside typical industry range (${(minStandard * 100).toFixed(1)}%-${(maxStandard * 100).toFixed(1)}%)`,
            severity: severity as "medium" | "high",
            channel
        });
    }

    return warnings;
}

function checkDeviationWarnings(
    channel: Channel,
    allocatedPct: number,
    expectedPct: number,
    deviation: number,
    thresholds: BenchmarkThresholds
): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (deviation > thresholds.extremeDeviation) {
        warnings.push({
            type: "extreme_benchmark_deviation",
            message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) deviates extremely from benchmark expectation (${(expectedPct * 100).toFixed(1)}%)`,
            severity: "high",
            channel
        });
    } else if (deviation > thresholds.deviationWarning) {
        warnings.push({
            type: "benchmark_deviation",
            message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) deviates significantly from benchmark expectation (${(expectedPct * 100).toFixed(1)}%)`,
            severity: "medium",
            channel
        });
    }

    return warnings;
}

function checkPortfolioIssues(
    allocation: Allocation,
    context?: ValidationContext
): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const maxAllocation = Math.max(...channels.map(ch => allocation[ch]));
    if (maxAllocation > 0.8) {
        warnings.push({
            type: "portfolio_concentration",
            message: `Portfolio is over-concentrated with ${(maxAllocation * 100).toFixed(1)}% in a single channel. Consider diversification.`,
            severity: "high"
        });
    }

    const activeChannels = channels.filter(ch => allocation[ch] > 0.05).length;
    if (activeChannels < 2) {
        warnings.push({
            type: "insufficient_diversification",
            message: `Portfolio uses only ${activeChannels} channel(s). Consider diversifying across multiple channels for better risk management.`,
            severity: "medium"
        });
    }

    if (context?.assumptions.goal === "cac" && allocation.linkedin < 0.1 && context.industryType === "b2b") {
        warnings.push({
            type: "goal_channel_mismatch",
            message: "For B2B CAC optimization, consider allocating more budget to LinkedIn for better lead quality.",
            severity: "low"
        });
    }

    if (context?.assumptions.goal === "revenue" && allocation.google < 0.2) {
        warnings.push({
            type: "goal_channel_mismatch",
            message: "For revenue optimization, consider allocating more budget to Google for higher conversion volume.",
            severity: "low"
        });
    }

    return warnings;
}

export function validateAllocation(
    allocation: Allocation,
    priors: ChannelPriors,
    context?: ValidationContext,
    thresholds: BenchmarkThresholds = defaultThresholds
): BenchmarkAnalysis {
    const channelDeviations: Record<Channel, number> = {} as Record<Channel, number>;
    const warnings: ValidationWarning[] = [];
    let totalDeviation = 0;

    const expectedAllocations = calculateExpectedAllocations(priors, context);

    for (const channel of channels) {
        const allocatedPct = allocation[channel];
        const expectedPct = expectedAllocations[channel];
        const standardRange = industryBenchmarks.standardAllocations[channel];

        const deviation = Math.abs(allocatedPct - expectedPct);
        channelDeviations[channel] = deviation;
        totalDeviation += deviation;

        const unrealisticWarnings = checkUnrealisticAllocation(
            channel,
            allocatedPct,
            standardRange,
            thresholds
        );
        warnings.push(...unrealisticWarnings);

        const deviationWarnings = checkDeviationWarnings(
            channel,
            allocatedPct,
            expectedPct,
            deviation,
            thresholds
        );
        warnings.push(...deviationWarnings);
    }

    const portfolioWarnings = checkPortfolioIssues(allocation, context);
    warnings.push(...portfolioWarnings);

    const maxPossibleDeviation = 2;
    const deviationScore = Math.min(1, totalDeviation / maxPossibleDeviation);

    return {
        deviationScore,
        channelDeviations,
        warnings
    };
}

export function getIndustryRecommendations(industryType: string): Record<Channel, number> | null {
    if (!industryBenchmarks.industryAdjustments[industryType as keyof typeof industryBenchmarks.industryAdjustments]) {
        return null;
    }

    const baseAllocations = industryBenchmarks.performanceBasedAllocations;
    const adjustments = industryBenchmarks.industryAdjustments[industryType as keyof typeof industryBenchmarks.industryAdjustments];
    const recommendations: Record<Channel, number> = {} as Record<Channel, number>;

    for (const channel of channels) {
        recommendations[channel] = baseAllocations[channel] + (adjustments[channel] || 0);
    }

    const total = channels.reduce((sum, ch) => sum + Math.max(0, recommendations[ch]), 0);
    if (total > 0) {
        for (const channel of channels) {
            recommendations[channel] = Math.max(0, recommendations[channel]) / total;
        }
    }

    return recommendations;
}

export class BenchmarkValidator {
    private thresholds: BenchmarkThresholds;

    constructor(thresholds: Partial<BenchmarkThresholds> = {}) {
        this.thresholds = { ...defaultThresholds, ...thresholds };
    }

    validateAllocation(
        allocation: Allocation,
        priors: ChannelPriors,
        context?: ValidationContext
    ): BenchmarkAnalysis {
        return validateAllocation(allocation, priors, context, this.thresholds);
    }

    getIndustryRecommendations(industryType: string): Record<Channel, number> | null {
        return getIndustryRecommendations(industryType);
    }

    updateThresholds(newThresholds: Partial<BenchmarkThresholds>): void {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    addIndustryBenchmarks(industryType: string, adjustments: Record<Channel, number>): void {
        // For simplicity, this would require modifying the global industryBenchmarks object
        // In a real implementation, this could be made more flexible
    }
}