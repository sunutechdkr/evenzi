/**
 * Utilitaires de validation et sanitisation pour Evenzi
 * Protection contre les injections et validation des données
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Configuration DOMPurify pour l'environnement serveur
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configuration personnalisée pour DOMPurify
purify.addHook('beforeSanitizeElements', (node) => {
  // Supprimer tous les scripts
  if (node.tagName === 'SCRIPT') {
    node.remove();
  }
});

/**
 * Sanitise une chaîne HTML
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
}

/**
 * Sanitise une chaîne de texte brut
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Supprimer < et >
    .replace(/javascript:/gi, '') // Supprimer javascript:
    .replace(/on\w+=/gi, '') // Supprimer les handlers d'événements
    .trim();
}

/**
 * Valide et sanitise un email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.toLowerCase().trim();
  
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Valide et sanitise un nom
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .replace(/[<>]/g, '')
    .replace(/[^\w\s\-.']/g, '') // Garder seulement lettres, espaces, tirets, points, apostrophes
    .trim()
    .substring(0, 100); // Limiter à 100 caractères
}

/**
 * Valide et sanitise une URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Autoriser seulement HTTP et HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Schémas de validation Zod pour les entités principales
 */

// Validation pour les événements
export const eventValidationSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .transform(sanitizeName),
  
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),
  
  location: z.string()
    .min(1, 'Le lieu est requis')
    .max(500, 'Le lieu ne peut pas dépasser 500 caractères')
    .transform(sanitizeText),
  
  startDate: z.string()
    .datetime('Format de date invalide'),
  
  endDate: z.string()
    .datetime('Format de date invalide')
    .optional(),
  
  maxParticipants: z.number()
    .int('Doit être un nombre entier')
    .positive('Doit être positif')
    .max(10000, 'Maximum 10000 participants')
    .optional(),
  
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'])
    .default('DRAFT')
});

// Validation pour les utilisateurs
export const userValidationSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .transform(sanitizeName),
  
  email: z.string()
    .email('Format d\'email invalide')
    .transform(sanitizeEmail),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/(?=.*[a-z])/, 'Doit contenir au moins une minuscule')
    .regex(/(?=.*[A-Z])/, 'Doit contenir au moins une majuscule')
    .regex(/(?=.*\d)/, 'Doit contenir au moins un chiffre')
    .regex(/(?=.*[@$!%*?&])/, 'Doit contenir au moins un caractère spécial')
    .optional(),
  
  role: z.enum(['USER', 'ORGANIZER', 'ADMIN', 'STAFF'])
    .default('USER')
});

// Validation pour les sessions
export const sessionValidationSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .transform(sanitizeName),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),
  
  speaker: z.string()
    .max(200, 'Le nom du speaker ne peut pas dépasser 200 caractères')
    .optional()
    .transform(val => val ? sanitizeName(val) : undefined),
  
  location: z.string()
    .max(200, 'Le lieu ne peut pas dépasser 200 caractères')
    .optional()
    .transform(val => val ? sanitizeText(val) : undefined),
  
  maxParticipants: z.number()
    .int('Doit être un nombre entier')
    .positive('Doit être positif')
    .max(1000, 'Maximum 1000 participants')
    .optional()
});

// Validation pour les sponsors
export const sponsorValidationSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .transform(sanitizeName),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),
  
  website: z.string()
    .url('URL invalide')
    .optional()
    .transform(val => val ? sanitizeUrl(val) : undefined),
  
  email: z.string()
    .email('Format d\'email invalide')
    .optional()
    .transform(val => val ? sanitizeEmail(val) : undefined),
  
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
    .default('BRONZE')
});

/**
 * Fonction utilitaire pour valider les paramètres de requête
 */
export function validateQueryParams(params: Record<string, any>, schema: z.ZodSchema) {
  try {
    return {
      success: true,
      data: schema.parse(params),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ field: 'general', message: 'Erreur de validation' }]
    };
  }
}

/**
 * Middleware de validation pour les APIs
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    const result = validateQueryParams(data, schema);
    
    if (!result.success) {
      throw new Error(`Validation failed: ${JSON.stringify(result.errors)}`);
    }
    
    return result.data;
  };
}

/**
 * Protection contre les injections SQL
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/['";\\]/g, '') // Supprimer les caractères SQL dangereux
    .replace(/--/g, '') // Supprimer les commentaires SQL
    .replace(/\/\*/g, '') // Supprimer les commentaires multi-lignes
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '') // Supprimer les procédures étendues
    .replace(/sp_/gi, '') // Supprimer les procédures stockées
    .trim();
}

/**
 * Validation des IDs (UUID)
 */
export const uuidSchema = z.string().uuid('ID invalide');

/**
 * Validation des paramètres de pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
  sortBy: z.string().optional().transform(val => val ? sanitizeSqlInput(val) : undefined),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Nettoyage des objets avec propriétés récursives
 */
export function deepSanitize(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeSqlInput(key)] = deepSanitize(value);
    }
    return sanitized;
  }
  
  return obj;
}
