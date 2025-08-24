/**
 * Système de logging sécurisé pour Evenzi
 * Évite l'exposition d'informations sensibles en production
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogContext {
  userId?: string;
  eventId?: string;
  participantId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private sanitizeData(data: any): any {
    if (this.isProduction) {
      // En production, on supprime les données sensibles
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        
        // Supprimer les champs sensibles
        const sensitiveFields = [
          'password', 'token', 'secret', 'key', 'hash',
          'email', 'phone', 'address', 'qrCode', 'shortCode'
        ];
        
        sensitiveFields.forEach(field => {
          if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
          }
        });
        
        return sanitized;
      }
    }
    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(data && { data: this.sanitizeData(data) })
    };

    if (this.isDevelopment) {
      // En développement, log complet pour le debug
      console[level === LogLevel.ERROR ? 'error' : 'log'](
        `[${timestamp}] ${level.toUpperCase()}: ${message}`,
        context ? JSON.stringify(context, null, 2) : '',
        data ? JSON.stringify(this.sanitizeData(data), null, 2) : ''
      );
    } else if (this.isProduction) {
      // En production, format JSON structuré pour les outils de monitoring
      console[level === LogLevel.ERROR ? 'error' : 'log'](JSON.stringify(logEntry));
    }
  }

  error(message: string, context?: LogContext, data?: any) {
    this.formatMessage(LogLevel.ERROR, message, context, data);
  }

  warn(message: string, context?: LogContext, data?: any) {
    this.formatMessage(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: LogContext, data?: any) {
    this.formatMessage(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: LogContext, data?: any) {
    if (this.isDevelopment) {
      this.formatMessage(LogLevel.DEBUG, message, context, data);
    }
  }

  // Méthodes spécialisées pour les actions de sécurité
  security(action: string, context: LogContext, result: 'success' | 'failure', details?: any) {
    const message = `Security action: ${action} - ${result}`;
    const logContext = { ...context, security: true };
    
    if (result === 'failure') {
      this.error(message, logContext, details);
    } else {
      this.info(message, logContext, details);
    }
  }

  // Log d'audit pour les actions importantes
  audit(action: string, context: LogContext, details?: any) {
    const message = `Audit: ${action}`;
    const logContext = { ...context, audit: true };
    this.info(message, logContext, details);
  }
}

// Instance singleton
export const logger = new Logger();

// Utilitaires pour les logs d'erreur HTTP
export const logHttpError = (
  error: Error,
  method: string,
  path: string,
  statusCode: number,
  context?: LogContext
) => {
  logger.error(
    `HTTP ${statusCode} ${method} ${path}: ${error.message}`,
    {
      ...context,
      method,
      path,
      statusCode,
      errorName: error.name
    },
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );
};

// Utilitaires pour les logs d'authentification
export const logAuth = (
  action: 'login' | 'logout' | 'failed_login' | 'token_validation',
  userId?: string,
  result: 'success' | 'failure' = 'success',
  details?: any
) => {
  logger.security(
    `Authentication ${action}`,
    { userId, action },
    result,
    details
  );
};

// Utilitaires pour les logs de check-in
export const logCheckIn = (
  action: 'attempt' | 'success' | 'duplicate' | 'not_found',
  eventId: string,
  participantId?: string,
  details?: any
) => {
  logger.audit(
    `Check-in ${action}`,
    { eventId, participantId, action: 'checkin' },
    details
  );
};
