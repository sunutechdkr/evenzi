#!/usr/bin/env node

/**
 * Script pour nettoyer les console.log en production
 * Remplace les console.log par des appels sécurisés
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = path.join(__dirname, '../src');

// Patterns à rechercher et remplacer
const replacements = [
  {
    // console.log simple
    pattern: /console\.log\(/g,
    replacement: 'devLog(',
    needsImport: true
  },
  {
    // console.error simple  
    pattern: /console\.error\(/g,
    replacement: 'devError(',
    needsImport: true
  },
  {
    // console.warn simple
    pattern: /console\.warn\(/g,
    replacement: 'devWarn(',
    needsImport: true
  },
  {
    // Capture des catch avec console.log
    pattern: /catch\s*\([^)]*\)\s*=>\s*console\.log\(/g,
    replacement: 'catch(e => devError(',
    needsImport: true
  }
];

// Import statement à ajouter
const IMPORT_STATEMENT = `import { devLog, devError, devWarn } from '@/lib/clientLogger';`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsImport = false;

  // Vérifier si le fichier contient déjà l'import
  const hasImport = content.includes('@/lib/clientLogger');
  
  // Appliquer les remplacements
  replacements.forEach(({ pattern, replacement, needsImport: requiresImport }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      if (requiresImport) {
        needsImport = true;
      }
    }
  });

  // Ajouter l'import si nécessaire
  if (needsImport && !hasImport && modified) {
    // Trouver où insérer l'import (après les autres imports)
    const importMatch = content.match(/import[^;]+;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertPosition) + 
                '\n' + IMPORT_STATEMENT + 
                content.slice(insertPosition);
    } else {
      // Si pas d'imports, ajouter au début après 'use client' si présent
      if (content.includes("'use client'")) {
        content = content.replace("'use client';", "'use client';\n\n" + IMPORT_STATEMENT);
      } else {
        content = IMPORT_STATEMENT + '\n\n' + content;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Processed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🧹 Cleaning up console.log statements...\n');
  
  // Chercher tous les fichiers TypeScript/JavaScript dans src
  const patterns = [
    `${SRC_DIR}/**/*.ts`,
    `${SRC_DIR}/**/*.tsx`,
    `${SRC_DIR}/**/*.js`,
    `${SRC_DIR}/**/*.jsx`
  ];

  let totalProcessed = 0;
  let totalModified = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern);
    
    files.forEach(file => {
      // Ignorer les fichiers de test et de configuration
      if (file.includes('.test.') || 
          file.includes('.spec.') || 
          file.includes('node_modules') ||
          file.includes('.d.ts')) {
        return;
      }

      totalProcessed++;
      
      try {
        if (processFile(file)) {
          totalModified++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalProcessed}`);
  console.log(`   Files modified: ${totalModified}`);
  console.log(`\n✨ Console.log cleanup completed!`);
  
  if (totalModified > 0) {
    console.log('\n⚠️  Remember to:');
    console.log('   1. Test your application thoroughly');
    console.log('   2. Check for any compilation errors');
    console.log('   3. Commit these changes to version control');
  }
}

// Vérifier si glob est installé
try {
  require('glob');
} catch (error) {
  console.error('❌ Error: "glob" package is required.');
  console.log('Install it with: npm install glob');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { processFile, main };
