// API Health Check Utility
import { API_BASE_URL } from './config';

export class ApiHealthCheck {
  private static instance: ApiHealthCheck;
  private isHealthy: boolean = false;
  private lastCheckTime: number = 0;
  private checkInterval: number = 5000; // Check every 5 seconds

  private constructor() {}

  static getInstance(): ApiHealthCheck {
    if (!ApiHealthCheck.instance) {
      ApiHealthCheck.instance = new ApiHealthCheck();
    }
    return ApiHealthCheck.instance;
  }

  /**
   * Check if API server is available
   * Uses caching to avoid checking too frequently
   */
  async isApiAvailable(): Promise<boolean> {
    const now = Date.now();
    
    // Return cached result if checked recently
    if (now - this.lastCheckTime < this.checkInterval) {
      return this.isHealthy;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      this.isHealthy = response.ok;
      this.lastCheckTime = now;
      
      if (this.isHealthy) {
        console.log('✅ API server is healthy');
      } else {
        console.warn('⚠️ API server returned non-ok status');
      }

      return this.isHealthy;
    } catch (error) {
      console.warn(`⚠️ API health check failed: ${error instanceof Error ? error.message : String(error)}`);
      this.isHealthy = false;
      this.lastCheckTime = now;
      return false;
    }
  }

  /**
   * Wait for API to become available
   * Useful for retrying failed operations
   */
  async waitForApiAvailable(maxWaitTime: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 1000; // Check every 1 second

    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isApiAvailable()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return false;
  }

  /**
   * Reset health status (useful when you know API just restarted)
   */
  reset(): void {
    this.isHealthy = false;
    this.lastCheckTime = 0;
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl(): string {
    return API_BASE_URL || 'http://localhost:5001';
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(): string {
    return (
      `❌ API Server Unavailable\n\n` +
      `The backend API server at ${API_BASE_URL} is not running.\n\n` +
      `📝 Steps to fix:\n` +
      `1. Navigate to the backend folder: cd ics-elearning-backend\n` +
      `2. Start the server: npm run start (or pnpm start)\n` +
      `3. Wait for the message "Listening on port 5001"\n` +
      `4. Return to the frontend and refresh the page (F5)\n\n` +
      `💡 Tip: Keep both servers (frontend and backend) running in separate terminals`
    );
  }
}

export const apiHealthCheck = ApiHealthCheck.getInstance();
