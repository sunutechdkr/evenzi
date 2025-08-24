/**
 * Client-side logging utilitaire pour Evenzi
 * Désactive automatiquement les logs en production côté client
 */

export enum ClientLogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: ClientLogLevel): boolean {
    if (!this.isDevelopment) {
      // En production, seules les erreurs sont loggées
      return level === ClientLogLevel.ERROR;
    }
    return true;
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog(ClientLogLevel.ERROR)) {
      console.error(`[EVENZI ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(ClientLogLevel.WARN)) {
      console.warn(`[EVENZI WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(ClientLogLevel.INFO)) {
      console.info(`[EVENZI INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(ClientLogLevel.DEBUG)) {
      console.log(`[EVENZI DEBUG] ${message}`, ...args);
    }
  }

  // Méthode pour les logs conditionnels
  conditionalLog(condition: boolean, level: ClientLogLevel, message: string, ...args: any[]) {
    if (condition && this.shouldLog(level)) {
      this[level](message, ...args);
    }
  }
}

// Instance singleton
export const clientLogger = new ClientLogger();

// Fonctions helper pour remplacer console.log direct
export const devLog = (message: string, ...args: any[]) => {
  clientLogger.debug(message, ...args);
};

export const devError = (message: string, ...args: any[]) => {
  clientLogger.error(message, ...args);
};

export const devWarn = (message: string, ...args: any[]) => {
  clientLogger.warn(message, ...args);
};

// Fonction pour remplacer tous les console.log existants
export const safeConsole = {
  log: devLog,
  error: devError,
  warn: devWarn,
  info: (message: string, ...args: any[]) => clientLogger.info(message, ...args),
  debug: devLog
};
