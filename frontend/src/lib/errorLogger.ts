/**
 * Error logging utility for development and production
 */

interface ErrorLogEntry {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  context?: any;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  log(error: Error, context?: any) {
    const entry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      context
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Logged');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Context:', context);
      console.error('Timestamp:', entry.timestamp);
      console.groupEnd();
    }

    // In production, you might want to send to an external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: ErrorLogEntry) {
    try {
      // Example: Send to your error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
      
      console.warn('Error logged (production):', entry.message);
    } catch (error) {
      console.error('Failed to send error to external service:', error);
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Handle React Error Boundary errors
  logReactError(error: Error, errorInfo: any) {
    this.log(error, {
      type: 'React Error Boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  // Handle unhandled promise rejections
  logUnhandledRejection(event: PromiseRejectionEvent) {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    this.log(error, {
      type: 'Unhandled Promise Rejection',
      reason: event.reason
    });
  }

  // Handle global errors
  logGlobalError(event: ErrorEvent) {
    const error = new Error(event.message);
    error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
    
    this.log(error, {
      type: 'Global Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Set up global error handlers (client-side only)
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logUnhandledRejection(event);
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    errorLogger.logGlobalError(event);
  });

  // Handle React errors (if not caught by Error Boundary)
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if this looks like a React error
    const message = args[0];
    if (typeof message === 'string' && message.includes('React')) {
      const error = new Error(message);
      errorLogger.log(error, {
        type: 'React Console Error',
        args: args.slice(1)
      });
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };
}

export default errorLogger;