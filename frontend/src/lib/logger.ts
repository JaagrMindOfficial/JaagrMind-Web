/**
 * Simple logger utility for frontend debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${context}]`;
    
    switch (level) {
      case 'info':
        console.log(`%c${prefix} ${message}`, 'color: #3b82f6', data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
       case 'debug':
        console.debug(`%c${prefix} ${message}`, 'color: #9ca3af', data || '');
        break;
    }
  }

  info(context: string, message: string, data?: any) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: any) {
    this.log('error', context, message, data);
  }

  debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data);
  }
}

export const logger = new Logger();
