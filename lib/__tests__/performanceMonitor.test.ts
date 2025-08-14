/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Unit tests for PerformanceMonitor
 */

import { PerformanceMonitor, type PerformanceAlert } from "../performanceMonitor";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      memoryUsageMB: 100,
      averageResponseTimeMs: 2000,
      errorRatePercent: 5,
      cacheHitRatePercent: 70,
      concurrentOperationsCount: 5
    });
  });

  describe("Alert Generation", () => {
    it("should generate memory usage alerts", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 150, // 1.5x threshold of 100 = high severity
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('memory');
      expect(alerts[0].severity).toBe('high'); // 1.5x threshold = high severity
      expect(alerts[0].message).toContain('High memory usage');
    });

    it("should generate response time alerts", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 3000, // 1.5x threshold of 2000
        totalRequests: 10
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('timeout');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].message).toContain('Slow response time');
    });

    it("should generate concurrency alerts", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 8, // Above threshold of 5
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('concurrency');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toContain('High concurrent operations');
    });

    it("should generate cache hit rate alerts", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 2,
        cacheHitRate: 0.5, // Below threshold of 70%
        averageResponseTime: 1000,
        totalRequests: 10
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('cache');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].message).toContain('Low cache hit rate');
    });

    it("should generate error rate alerts", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 100,
        errorCount: 10 // 10% error rate, above threshold of 5%
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('error_rate');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toContain('High error rate');
    });

    it("should generate multiple alerts for multiple issues", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 150, // Above threshold
        activeOperations: 8, // Above threshold
        cacheHitRate: 0.5, // Below threshold
        averageResponseTime: 3000, // Above threshold
        totalRequests: 100,
        errorCount: 10 // Above threshold
      });

      expect(alerts).toHaveLength(5);
      expect(alerts.map(a => a.type)).toContain('memory');
      expect(alerts.map(a => a.type)).toContain('timeout');
      expect(alerts.map(a => a.type)).toContain('concurrency');
      expect(alerts.map(a => a.type)).toContain('cache');
      expect(alerts.map(a => a.type)).toContain('error_rate');
    });

    it("should determine correct severity levels", () => {
      // Critical memory usage (2x threshold)
      let alerts = monitor.recordMetrics({
        memoryUsageMB: 200, // Exactly 2x threshold of 100
        activeOperations: 1,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });
      expect(alerts[0].severity).toBe('critical');

      // High memory usage (1.5x threshold)
      alerts = monitor.recordMetrics({
        memoryUsageMB: 150, // Exactly 1.5x threshold of 100
        activeOperations: 1,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });
      expect(alerts[0].severity).toBe('high');

      // Medium memory usage (1.2x threshold)
      alerts = monitor.recordMetrics({
        memoryUsageMB: 120, // Exactly 1.2x threshold of 100
        activeOperations: 1,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });
      expect(alerts[0].severity).toBe('medium');
    });
  });

  describe("Performance Trends", () => {
    it("should calculate increasing trends", () => {
      const baseTime = Date.now();
      
      // Record increasing memory usage over time with significant intervals
      for (let i = 0; i < 5; i++) {
        // Mock the timestamp to create a clear trend
        const mockTime = baseTime + i * 60000; // 1 minute intervals
        jest.spyOn(Date, 'now').mockReturnValue(mockTime);
        
        monitor.recordMetrics({
          memoryUsageMB: 50 + i * 20, // Increasing from 50 to 130 (significant change)
          activeOperations: 1,
          cacheHitRate: 0.8,
          averageResponseTime: 1000,
          totalRequests: 10 + i
        });
      }

      const trends = monitor.getPerformanceTrends(1);
      const memoryTrend = trends.find(t => t.metric === 'memoryUsageMB');
      
      expect(memoryTrend).toBeDefined();
      expect(memoryTrend!.trend).toBe('increasing');
      expect(memoryTrend!.changeRate).toBeGreaterThan(0);
      
      jest.restoreAllMocks();
    });

    it("should calculate decreasing trends", () => {
      const baseTime = Date.now();
      
      // Record decreasing response time over time with significant intervals
      for (let i = 0; i < 5; i++) {
        const mockTime = baseTime + i * 60000; // 1 minute intervals
        jest.spyOn(Date, 'now').mockReturnValue(mockTime);
        
        monitor.recordMetrics({
          memoryUsageMB: 50,
          activeOperations: 1,
          cacheHitRate: 0.8,
          averageResponseTime: 3000 - i * 400, // Decreasing from 3000 to 1400 (significant change)
          totalRequests: 10 + i
        });
      }

      const trends = monitor.getPerformanceTrends(1);
      const responseTrend = trends.find(t => t.metric === 'averageResponseTime');
      
      expect(responseTrend).toBeDefined();
      expect(responseTrend!.trend).toBe('decreasing');
      expect(responseTrend!.changeRate).toBeLessThan(0);
      
      jest.restoreAllMocks();
    });

    it("should calculate stable trends", () => {
      const baseTime = Date.now();
      
      // Record stable metrics over time
      for (let i = 0; i < 5; i++) {
        const mockTime = baseTime + i * 60000; // 1 minute intervals
        jest.spyOn(Date, 'now').mockReturnValue(mockTime);
        
        monitor.recordMetrics({
          memoryUsageMB: 50 + (i % 2 === 0 ? 0 : 1), // Very small variation (50, 51, 50, 51, 50)
          activeOperations: 1,
          cacheHitRate: 0.8,
          averageResponseTime: 1000,
          totalRequests: 10 + i
        });
      }

      const trends = monitor.getPerformanceTrends(1);
      const memoryTrend = trends.find(t => t.metric === 'memoryUsageMB');
      
      expect(memoryTrend).toBeDefined();
      expect(memoryTrend!.trend).toBe('stable');
      expect(Math.abs(memoryTrend!.changeRate)).toBeLessThan(1); // Adjusted threshold
      
      jest.restoreAllMocks();
    });
  });

  describe("Performance Summary", () => {
    it("should report healthy status with no alerts", () => {
      monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      const summary = monitor.getPerformanceSummary();
      expect(summary.currentStatus).toBe('healthy');
      expect(summary.recentAlerts).toBe(0);
      expect(summary.criticalAlerts).toBe(0);
    });

    it("should report warning status with non-critical alerts", () => {
      monitor.recordMetrics({
        memoryUsageMB: 120, // Medium alert
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      const summary = monitor.getPerformanceSummary();
      expect(summary.currentStatus).toBe('warning');
      expect(summary.recentAlerts).toBe(1);
      expect(summary.criticalAlerts).toBe(0);
    });

    it("should report critical status with critical alerts", () => {
      monitor.recordMetrics({
        memoryUsageMB: 250, // Critical alert
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      const summary = monitor.getPerformanceSummary();
      expect(summary.currentStatus).toBe('critical');
      expect(summary.recentAlerts).toBe(1);
      expect(summary.criticalAlerts).toBe(1);
    });

    it("should provide relevant recommendations", () => {
      // Generate memory and cache alerts
      monitor.recordMetrics({
        memoryUsageMB: 150,
        activeOperations: 2,
        cacheHitRate: 0.5,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      const summary = monitor.getPerformanceSummary();
      
      // Check that recommendations array contains strings with "cache" and "memory"
      const hasMemoryRecommendation = summary.recommendations.some(rec => 
        rec.toLowerCase().includes('memory')
      );
      const hasCacheRecommendation = summary.recommendations.some(rec => 
        rec.toLowerCase().includes('cache')
      );
      
      expect(hasMemoryRecommendation).toBe(true);
      expect(hasCacheRecommendation).toBe(true);
    });
  });

  describe("Configuration", () => {
    it("should update thresholds correctly", () => {
      monitor.configureThresholds({
        memoryUsageMB: 200,
        averageResponseTimeMs: 3000
      });

      // Should not generate alert with new higher thresholds
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 150,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 2500,
        totalRequests: 10
      });

      expect(alerts).toHaveLength(0);
    });

    it("should clear history correctly", () => {
      // Generate some alerts and metrics
      monitor.recordMetrics({
        memoryUsageMB: 150,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      let alerts = monitor.getRecentAlerts(24);
      expect(alerts.length).toBeGreaterThan(0);

      monitor.clearHistory();

      alerts = monitor.getRecentAlerts(24);
      expect(alerts).toHaveLength(0);

      const trends = monitor.getPerformanceTrends(24);
      expect(trends).toHaveLength(0);
    });
  });

  describe("Data Export", () => {
    it("should export performance data correctly", () => {
      // Generate some data
      monitor.recordMetrics({
        memoryUsageMB: 150,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 10
      });

      const exportedData = monitor.exportPerformanceData();

      expect(exportedData).toHaveProperty('alerts');
      expect(exportedData).toHaveProperty('metricsHistory');
      expect(exportedData).toHaveProperty('thresholds');

      expect(exportedData.alerts.length).toBeGreaterThan(0);
      expect(Object.keys(exportedData.metricsHistory).length).toBeGreaterThan(0);
      expect(exportedData.thresholds.memoryUsageMB).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero total requests gracefully", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 50,
        activeOperations: 2,
        cacheHitRate: 0.8,
        averageResponseTime: 1000,
        totalRequests: 0,
        errorCount: 0
      });

      expect(alerts).toHaveLength(0); // No error rate alert with 0 requests
    });

    it("should handle very large metric values", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: 10000,
        activeOperations: 1000,
        cacheHitRate: 0.8,
        averageResponseTime: 100000,
        totalRequests: 1000000
      });

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
    });

    it("should handle negative or invalid metric values", () => {
      const alerts = monitor.recordMetrics({
        memoryUsageMB: -10, // Invalid
        activeOperations: -5, // Invalid
        cacheHitRate: 1.5, // Invalid (>1)
        averageResponseTime: -1000, // Invalid
        totalRequests: 10
      });

      // Should not crash and should handle gracefully
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});