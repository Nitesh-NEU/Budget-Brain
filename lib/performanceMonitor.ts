/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Performance Monitor - Advanced monitoring and alerting for optimization pipeline
 */

export interface PerformanceAlert {
  type: 'memory' | 'timeout' | 'concurrency' | 'cache' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics: Record<string, number>;
}

export interface PerformanceThresholds {
  memoryUsageMB: number;
  averageResponseTimeMs: number;
  errorRatePercent: number;
  cacheHitRatePercent: number;
  concurrentOperationsCount: number;
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // Change per hour
}

export class PerformanceMonitor {
  private alerts: PerformanceAlert[] = [];
  private maxAlerts: number = 100;
  private thresholds: PerformanceThresholds;
  private metricsHistory: Map<string, Array<{ value: number; timestamp: number }>> = new Map();
  private maxHistorySize: number = 1000;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      memoryUsageMB: 200,
      averageResponseTimeMs: 5000,
      errorRatePercent: 5,
      cacheHitRatePercent: 70,
      concurrentOperationsCount: 8,
      ...thresholds
    };
  }

  /**
   * Record performance metrics and check for alerts
   */
  recordMetrics(metrics: {
    memoryUsageMB: number;
    activeOperations: number;
    cacheHitRate: number;
    averageResponseTime: number;
    totalRequests: number;
    errorCount?: number;
  }): PerformanceAlert[] {
    const timestamp = Date.now();
    const newAlerts: PerformanceAlert[] = [];

    // Record metrics in history
    this.recordMetricValue('memoryUsageMB', metrics.memoryUsageMB, timestamp);
    this.recordMetricValue('activeOperations', metrics.activeOperations, timestamp);
    this.recordMetricValue('cacheHitRate', metrics.cacheHitRate, timestamp);
    this.recordMetricValue('averageResponseTime', metrics.averageResponseTime, timestamp);
    this.recordMetricValue('totalRequests', metrics.totalRequests, timestamp);

    // Check memory usage
    if (metrics.memoryUsageMB > this.thresholds.memoryUsageMB) {
      const severity = this.getMemorySeverity(metrics.memoryUsageMB);
      newAlerts.push({
        type: 'memory',
        severity,
        message: `High memory usage: ${metrics.memoryUsageMB.toFixed(2)}MB (threshold: ${this.thresholds.memoryUsageMB}MB)`,
        timestamp,
        metrics: { memoryUsageMB: metrics.memoryUsageMB, threshold: this.thresholds.memoryUsageMB }
      });
    }

    // Check response time
    if (metrics.averageResponseTime > this.thresholds.averageResponseTimeMs) {
      const severity = this.getResponseTimeSeverity(metrics.averageResponseTime);
      newAlerts.push({
        type: 'timeout',
        severity,
        message: `Slow response time: ${metrics.averageResponseTime.toFixed(0)}ms (threshold: ${this.thresholds.averageResponseTimeMs}ms)`,
        timestamp,
        metrics: { averageResponseTime: metrics.averageResponseTime, threshold: this.thresholds.averageResponseTimeMs }
      });
    }

    // Check concurrent operations
    if (metrics.activeOperations > this.thresholds.concurrentOperationsCount) {
      newAlerts.push({
        type: 'concurrency',
        severity: 'high',
        message: `High concurrent operations: ${metrics.activeOperations} (threshold: ${this.thresholds.concurrentOperationsCount})`,
        timestamp,
        metrics: { activeOperations: metrics.activeOperations, threshold: this.thresholds.concurrentOperationsCount }
      });
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < this.thresholds.cacheHitRatePercent / 100) {
      newAlerts.push({
        type: 'cache',
        severity: 'medium',
        message: `Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}% (threshold: ${this.thresholds.cacheHitRatePercent}%)`,
        timestamp,
        metrics: { cacheHitRate: metrics.cacheHitRate * 100, threshold: this.thresholds.cacheHitRatePercent }
      });
    }

    // Check error rate if provided
    if (metrics.errorCount !== undefined && metrics.totalRequests > 0) {
      const errorRate = (metrics.errorCount / metrics.totalRequests) * 100;
      this.recordMetricValue('errorRate', errorRate, timestamp);

      if (errorRate > this.thresholds.errorRatePercent) {
        newAlerts.push({
          type: 'error_rate',
          severity: 'high',
          message: `High error rate: ${errorRate.toFixed(1)}% (threshold: ${this.thresholds.errorRatePercent}%)`,
          timestamp,
          metrics: { errorRate, threshold: this.thresholds.errorRatePercent }
        });
      }
    }

    // Add new alerts to history
    this.alerts.push(...newAlerts);

    // Trim alerts if needed
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Get performance trends for analysis
   */
  getPerformanceTrends(hoursBack: number = 24): PerformanceTrend[] {
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    const trends: PerformanceTrend[] = [];

    for (const [metric, history] of this.metricsHistory.entries()) {
      const recentData = history.filter(entry => entry.timestamp >= cutoffTime);
      
      if (recentData.length < 2) {
        continue; // Need at least 2 data points for trend analysis
      }

      const values = recentData.map(entry => entry.value);
      const timestamps = recentData.map(entry => entry.timestamp);
      
      // Calculate trend using linear regression
      const trend = this.calculateTrend(values, timestamps);
      
      trends.push({
        metric,
        values,
        timestamps,
        trend: trend.direction,
        changeRate: trend.changeRate
      });
    }

    return trends;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hoursBack: number = 24): PerformanceAlert[] {
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoffTime);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    currentStatus: 'healthy' | 'warning' | 'critical';
    recentAlerts: number;
    criticalAlerts: number;
    trends: PerformanceTrend[];
    recommendations: string[];
  } {
    const recentAlerts = this.getRecentAlerts(1); // Last hour
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const trends = this.getPerformanceTrends(24);

    let currentStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      currentStatus = 'critical';
    } else if (recentAlerts.length > 0) {
      currentStatus = 'warning';
    }

    const recommendations = this.generateRecommendations(recentAlerts, trends);

    return {
      currentStatus,
      recentAlerts: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      trends,
      recommendations
    };
  }

  /**
   * Configure performance thresholds
   */
  configureThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear alerts and metrics history
   */
  clearHistory(): void {
    this.alerts = [];
    this.metricsHistory.clear();
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    alerts: PerformanceAlert[];
    metricsHistory: Record<string, Array<{ value: number; timestamp: number }>>;
    thresholds: PerformanceThresholds;
  } {
    const metricsHistory: Record<string, Array<{ value: number; timestamp: number }>> = {};
    for (const [key, value] of this.metricsHistory.entries()) {
      metricsHistory[key] = [...value];
    }

    return {
      alerts: [...this.alerts],
      metricsHistory,
      thresholds: { ...this.thresholds }
    };
  }

  // Private helper methods

  private recordMetricValue(metric: string, value: number, timestamp: number): void {
    if (!this.metricsHistory.has(metric)) {
      this.metricsHistory.set(metric, []);
    }

    const history = this.metricsHistory.get(metric)!;
    history.push({ value, timestamp });

    // Trim history if needed
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }

  private getMemorySeverity(memoryUsageMB: number): PerformanceAlert['severity'] {
    const ratio = memoryUsageMB / this.thresholds.memoryUsageMB;
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  private getResponseTimeSeverity(responseTime: number): PerformanceAlert['severity'] {
    const ratio = responseTime / this.thresholds.averageResponseTimeMs;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private calculateTrend(values: number[], timestamps: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', changeRate: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = timestamps.reduce((sum, t) => sum + t, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
    const sumXX = timestamps.reduce((sum, t) => sum + t * t, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      return { direction: 'stable', changeRate: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    
    // Convert slope to change per hour
    const changeRate = slope * (60 * 60 * 1000); // milliseconds to hours

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changeRate) < 0.1) { // Increased threshold for stability
      direction = 'stable';
    } else if (changeRate > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return { direction, changeRate };
  }

  private generateRecommendations(alerts: PerformanceAlert[], trends: PerformanceTrend[]): string[] {
    const recommendations: string[] = [];

    // Memory-based recommendations
    const memoryAlerts = alerts.filter(a => a.type === 'memory');
    if (memoryAlerts.length > 0) {
      recommendations.push("Consider reducing cache size or implementing more aggressive cache eviction");
      recommendations.push("Monitor for memory leaks in validation algorithms");
    }

    // Response time recommendations
    const timeoutAlerts = alerts.filter(a => a.type === 'timeout');
    if (timeoutAlerts.length > 0) {
      recommendations.push("Consider using 'fast' enhancement level for better response times");
      recommendations.push("Review timeout configurations for validation algorithms");
    }

    // Cache recommendations
    const cacheAlerts = alerts.filter(a => a.type === 'cache');
    if (cacheAlerts.length > 0) {
      recommendations.push("Increase cache size or adjust cache key generation for better hit rates");
      recommendations.push("Review cache expiration settings");
    }

    // Concurrency recommendations
    const concurrencyAlerts = alerts.filter(a => a.type === 'concurrency');
    if (concurrencyAlerts.length > 0) {
      recommendations.push("Increase maxConcurrentOperations limit or implement request queuing");
      recommendations.push("Consider horizontal scaling for high-load scenarios");
    }

    // Trend-based recommendations
    const memoryTrend = trends.find(t => t.metric === 'memoryUsageMB');
    if (memoryTrend && memoryTrend.trend === 'increasing' && memoryTrend.changeRate > 10) {
      recommendations.push("Memory usage is increasing rapidly - investigate potential memory leaks");
    }

    const responseTrend = trends.find(t => t.metric === 'averageResponseTime');
    if (responseTrend && responseTrend.trend === 'increasing' && responseTrend.changeRate > 1000) {
      recommendations.push("Response times are degrading - consider performance optimizations");
    }

    return recommendations;
  }
}