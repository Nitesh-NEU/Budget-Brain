import { NextRequest, NextResponse } from "next/server";
import { OptimizeBodySchema } from "@/lib/zod";
import { optimize } from "@/lib/optimizer";
import { AccuracyEnhancementService } from "@/lib/accuracyEnhancementService";
import { PipelineManager } from "@/lib/pipelineManager";
import type { OptimizationPipeline } from "@/types/pipeline";

// Global instance for performance monitoring and caching
let globalEnhancementService: AccuracyEnhancementService | null = null;

function getEnhancementService(): AccuracyEnhancementService {
  if (!globalEnhancementService) {
    globalEnhancementService = new AccuracyEnhancementService();
  }
  return globalEnhancementService;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Return performance and cache statistics
      const enhancementService = getEnhancementService();
      const resourceUsage = enhancementService.getResourceUsage();
      const cacheStats = enhancementService.getCacheStats();

      return NextResponse.json({
        resourceUsage,
        cacheStats,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'clear-cache') {
      // Clear the cache
      const enhancementService = getEnhancementService();
      enhancementService.clearCache();
      
      return NextResponse.json({
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'configure-cache') {
      // Configure cache settings
      const enhancementService = getEnhancementService();
      const config: any = {};
      
      if (searchParams.get('maxCacheSize')) {
        config.maxCacheSize = parseInt(searchParams.get('maxCacheSize')!);
      }
      if (searchParams.get('maxCacheAgeMins')) {
        config.maxCacheAgeMins = parseInt(searchParams.get('maxCacheAgeMins')!);
      }
      if (searchParams.get('maxMemoryUsageMB')) {
        config.maxMemoryUsageMB = parseInt(searchParams.get('maxMemoryUsageMB')!);
      }
      if (searchParams.get('maxConcurrentOperations')) {
        config.maxConcurrentOperations = parseInt(searchParams.get('maxConcurrentOperations')!);
      }

      enhancementService.configureCaching(config);
      
      return NextResponse.json({
        message: "Cache configuration updated",
        config,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'performance-report') {
      // Get detailed performance report
      const enhancementService = getEnhancementService();
      const report = enhancementService.getDetailedPerformanceReport();
      
      return NextResponse.json({
        ...report,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'performance-alerts') {
      // Get performance alerts
      const enhancementService = getEnhancementService();
      const hoursBack = parseInt(searchParams.get('hours') || '24');
      const alerts = enhancementService.getPerformanceAlerts(hoursBack);
      
      return NextResponse.json({
        alerts,
        hoursBack,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'performance-trends') {
      // Get performance trends
      const enhancementService = getEnhancementService();
      const hoursBack = parseInt(searchParams.get('hours') || '24');
      const trends = enhancementService.getPerformanceTrends(hoursBack);
      
      return NextResponse.json({
        trends,
        hoursBack,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'configure-performance') {
      // Configure performance monitoring thresholds
      const enhancementService = getEnhancementService();
      const thresholds: any = {};
      
      if (searchParams.get('memoryUsageMB')) {
        thresholds.memoryUsageMB = parseInt(searchParams.get('memoryUsageMB')!);
      }
      if (searchParams.get('averageResponseTimeMs')) {
        thresholds.averageResponseTimeMs = parseInt(searchParams.get('averageResponseTimeMs')!);
      }
      if (searchParams.get('errorRatePercent')) {
        thresholds.errorRatePercent = parseInt(searchParams.get('errorRatePercent')!);
      }
      if (searchParams.get('cacheHitRatePercent')) {
        thresholds.cacheHitRatePercent = parseInt(searchParams.get('cacheHitRatePercent')!);
      }
      if (searchParams.get('concurrentOperationsCount')) {
        thresholds.concurrentOperationsCount = parseInt(searchParams.get('concurrentOperationsCount')!);
      }

      enhancementService.configurePerformanceThresholds(thresholds);
      
      return NextResponse.json({
        message: "Performance thresholds updated",
        thresholds,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'export-performance') {
      // Export all performance data
      const enhancementService = getEnhancementService();
      const data = enhancementService.exportPerformanceData();
      
      return NextResponse.json({
        ...data,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'reset-performance') {
      // Reset performance monitoring data
      const enhancementService = getEnhancementService();
      enhancementService.resetPerformanceMonitoring();
      
      return NextResponse.json({
        message: "Performance monitoring data reset",
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: "Optimization API - Performance Monitoring & Pipeline Visualization",
      availableActions: [
        "stats - Get performance and cache statistics",
        "clear-cache - Clear the optimization cache",
        "configure-cache - Configure cache settings",
        "performance-report - Get detailed performance report",
        "performance-alerts - Get performance alerts",
        "performance-trends - Get performance trends",
        "configure-performance - Configure performance thresholds",
        "export-performance - Export all performance data",
        "reset-performance - Reset performance monitoring data"
      ],
      pipelineFeatures: [
        "pipeline=true/false - Include pipeline execution data (default: true)",
        "timing=true/false - Include stage timing information (default: true)",
        "algorithmDetails=true/false - Include detailed algorithm information (default: false)"
      ],
      usage: {
        stats: "GET /api/optimize?action=stats",
        clearCache: "GET /api/optimize?action=clear-cache",
        configureCache: "GET /api/optimize?action=configure-cache&maxCacheSize=100&maxCacheAgeMins=60&maxMemoryUsageMB=256&maxConcurrentOperations=10",
        performanceReport: "GET /api/optimize?action=performance-report",
        performanceAlerts: "GET /api/optimize?action=performance-alerts&hours=24",
        performanceTrends: "GET /api/optimize?action=performance-trends&hours=24",
        configurePerformance: "GET /api/optimize?action=configure-performance&memoryUsageMB=200&averageResponseTimeMs=5000&errorRatePercent=5&cacheHitRatePercent=70&concurrentOperationsCount=8",
        exportPerformance: "GET /api/optimize?action=export-performance",
        resetPerformance: "GET /api/optimize?action=reset-performance",
        optimizeWithPipeline: "POST /api/optimize?pipeline=true&timing=true&algorithmDetails=true"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budget, priors, assumptions, runs } = OptimizeBodySchema.parse(body);

    // Extract query parameters for enhancement configuration
    const searchParams = req.nextUrl.searchParams;
    const enhancementLevel = searchParams.get('enhancement') as 'fast' | 'standard' | 'thorough' | null;
    const includeAlternatives = searchParams.get('alternatives') !== 'false';
    const validateBenchmarks = searchParams.get('benchmarks') !== 'false';
    const enableLLMValidation = searchParams.get('llm') !== 'false';
    
    // Check if enhanced optimization is requested
    // Priority: query param 'enhanced' > body 'enhanced' > default true for better results
    let useEnhancedOptimization = true;
    if (searchParams.has('enhanced')) {
      useEnhancedOptimization = searchParams.get('enhanced') !== 'false';
    } else if (body.hasOwnProperty('enhanced')) {
      useEnhancedOptimization = body.enhanced !== false;
    }

    if (useEnhancedOptimization) {
      // Use the global AccuracyEnhancementService for better results and caching
      const enhancementService = getEnhancementService();
      
      const enhancedResult = await enhancementService.enhanceOptimization(
        budget,
        priors,
        assumptions,
        {
          level: enhancementLevel || 'standard',
          includeAlternatives,
          validateAgainstBenchmarks: validateBenchmarks,
          enableLLMValidation,
          enableCaching: searchParams.get('cache') !== 'false',
          timeoutMs: searchParams.get('timeout') ? parseInt(searchParams.get('timeout')!) : undefined,
          maxMemoryUsageMB: searchParams.get('maxMemory') ? parseInt(searchParams.get('maxMemory')!) : undefined,
          maxConcurrentOperations: searchParams.get('maxConcurrent') ? parseInt(searchParams.get('maxConcurrent')!) : undefined
        }
      );

      // For backward compatibility, always include the original response structure
      const response: any = {
        allocation: enhancedResult.allocation,
        detOutcome: enhancedResult.detOutcome,
        p10: enhancedResult.mc.p10,
        p50: enhancedResult.mc.p50,
        p90: enhancedResult.mc.p90,
        intervals: enhancedResult.intervals,
        objective: enhancedResult.objective,
        summary: enhancedResult.summary
      };

      // Only include enhanced features if they exist and client hasn't opted out
      if (enhancedResult.confidence && searchParams.get('confidence') !== 'false') {
        response.confidence = enhancedResult.confidence;
      }
      if (enhancedResult.validation && searchParams.get('validation') !== 'false') {
        response.validation = enhancedResult.validation;
      }
      if (enhancedResult.alternatives && includeAlternatives) {
        response.alternatives = enhancedResult.alternatives;
      }

      // Include pipeline data if requested (default: true)
      if (searchParams.get('pipeline') !== 'false' && enhancedResult.pipeline) {
        response.pipeline = enhancedResult.pipeline;
      }
      
      // Include timing data if requested (default: true)
      if (searchParams.get('timing') !== 'false' && enhancedResult.timing) {
        response.timing = enhancedResult.timing;
      }
      
      // Include algorithm details if requested (default: false for backward compatibility)
      if (searchParams.get('algorithmDetails') === 'true' && enhancedResult.algorithmDetails) {
        response.algorithmDetails = enhancedResult.algorithmDetails;
      }

      return NextResponse.json(response);
    } else {
      // Fallback to original optimization for full backward compatibility
      const { best, intervals } = optimize(budget, priors, assumptions, runs ?? 800);

      const summary =
        `Deterministic baseline estimated ${best.det.toFixed(2)} for ${assumptions.goal}. ` +
        `Monte Carlo p50 ${best.mc.p50.toFixed(2)} with p10 ${best.mc.p10.toFixed(2)} and p90 ${best.mc.p90.toFixed(2)}. ` +
        `Split chosen by ${assumptions.goal} objective.`;

      return NextResponse.json({
        allocation: best.split,
        detOutcome: best.det,
        p10: best.mc.p10,
        p50: best.mc.p50,
        p90: best.mc.p90,
        intervals,
        objective: assumptions.goal,
        summary
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
