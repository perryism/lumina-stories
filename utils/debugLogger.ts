/**
 * Debug Logger Service
 * Logs API requests to a downloadable file when debug mode is enabled
 */

import { getSettings } from './settingsService';

interface APILogEntry {
  timestamp: string;
  provider: string;
  endpoint: string;
  model?: string;
  requestType: string;
  requestData?: any;
  responseData?: any;
  error?: string;
  duration?: number;
}

class DebugLogger {
  private logs: APILogEntry[] = [];
  private isEnabled: boolean = false;

  constructor() {
    this.updateSettings();
  }

  /**
   * Update debug mode setting from localStorage
   */
  updateSettings() {
    const settings = getSettings();
    this.isEnabled = settings.debugMode || false;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    this.updateSettings();
    return this.isEnabled;
  }

  /**
   * Log an API request
   */
  logRequest(entry: Omit<APILogEntry, 'timestamp'>) {
    if (!this.isEnabled) return;

    const logEntry: APILogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.push(logEntry);
    
    // Also log to console for immediate visibility
    console.log('[DEBUG API]', logEntry);
  }

  /**
   * Log an API request with timing
   */
  async logRequestWithTiming<T>(
    entry: Omit<APILogEntry, 'timestamp' | 'duration' | 'responseData' | 'error'>,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return requestFn();
    }

    const startTime = performance.now();
    try {
      const response = await requestFn();
      const duration = performance.now() - startTime;

      this.logRequest({
        ...entry,
        responseData: this.sanitizeResponse(response),
        duration: Math.round(duration),
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.logRequest({
        ...entry,
        error: error instanceof Error ? error.message : String(error),
        duration: Math.round(duration),
      });

      throw error;
    }
  }

  /**
   * Sanitize response data to avoid logging sensitive information
   */
  private sanitizeResponse(response: any): any {
    if (!response) return null;

    // For large responses, just log metadata
    if (typeof response === 'object') {
      if (response.text && typeof response.text === 'string' && response.text.length > 500) {
        return {
          type: 'text_response',
          length: response.text.length,
          preview: response.text.substring(0, 200) + '...',
        };
      }
      if (response.choices && Array.isArray(response.choices)) {
        return {
          type: 'openai_response',
          choices_count: response.choices.length,
          first_choice_preview: response.choices[0]?.message?.content?.substring(0, 200) + '...',
        };
      }
    }

    return response;
  }

  /**
   * Get all logs
   */
  getLogs(): APILogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    console.log('[DEBUG] Logs cleared');
  }

  /**
   * Export logs to a downloadable JSON file
   */
  exportLogs() {
    if (this.logs.length === 0) {
      alert('No logs to export. Debug mode may not be enabled or no API requests have been made yet.');
      return;
    }

    const logData = {
      exportDate: new Date().toISOString(),
      totalRequests: this.logs.length,
      logs: this.logs,
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina-api-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[DEBUG] Exported ${this.logs.length} log entries`);
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const stats = {
      totalRequests: this.logs.length,
      byProvider: {} as Record<string, number>,
      byRequestType: {} as Record<string, number>,
      averageDuration: 0,
      errors: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    this.logs.forEach(log => {
      // Count by provider
      stats.byProvider[log.provider] = (stats.byProvider[log.provider] || 0) + 1;
      
      // Count by request type
      stats.byRequestType[log.requestType] = (stats.byRequestType[log.requestType] || 0) + 1;
      
      // Calculate average duration
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
      
      // Count errors
      if (log.error) {
        stats.errors++;
      }
    });

    if (durationCount > 0) {
      stats.averageDuration = Math.round(totalDuration / durationCount);
    }

    return stats;
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

